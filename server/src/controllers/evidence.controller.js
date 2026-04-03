import fs from 'fs';
import path from 'path';
import { db } from '../config/db.js';
import { emitToRoom } from '../sockets/index.js';

const UPLOAD_BASE = process.env.UPLOAD_DIR || './uploads';

/**
 * POST /api/evidence/:sosEventId/chunk  [owner]
 * Multer has already processed the file — req.file is populated.
 */
export const uploadChunk = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file received' });
    }

    const chunkIndex   = parseInt(req.body.chunkIndex, 10);
    const durationSecs = parseInt(req.body.durationSecs, 10);

    if (isNaN(chunkIndex) || isNaN(durationSecs)) {
      return res.status(400).json({ success: false, message: 'chunkIndex and durationSecs are required numbers' });
    }

    const { sosEventId } = req.params;

    const result = await db.query(
      `INSERT INTO evidence_recordings
         (sos_event_id, user_id, file_path, file_name, file_size, mime_type, duration_secs, chunk_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        sosEventId,
        req.user.id,
        req.file.path,
        req.file.filename,
        req.file.size,
        req.file.mimetype,
        durationSecs,
        chunkIndex,
      ]
    );

    const chunkId = result.rows[0].id;

    // Notify guardians live tracking this SOS that a new audio chunk is ready
    emitToRoom(`map:${sosEventId}`, 'evidence:new-chunk', {
      chunkId,
      chunkIndex,
      sosEventId
    });

    return res.status(201).json({
      success: true,
      data: { chunkId, chunkIndex, message: 'Chunk saved' },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/evidence/:sosEventId  [viewer]
 * Lists all chunks — never exposes file_path.
 */
export const listChunks = async (req, res, next) => {
  try {
    const { sosEventId } = req.params;

    const result = await db.query(
      `SELECT id, file_name, file_size, mime_type, duration_secs, chunk_index, created_at
       FROM evidence_recordings
       WHERE sos_event_id = $1
       ORDER BY chunk_index ASC`,
      [sosEventId]
    );

    return res.status(200).json({
      success: true,
      data: {
        sosEventId,
        totalChunks: result.rows.length,
        recordings: result.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/evidence/:sosEventId/chunk/:chunkId  [viewer]
 * Streams the audio file with range request support.
 */
export const streamChunk = async (req, res, next) => {
  try {
    const { sosEventId, chunkId } = req.params;

    const result = await db.query(
      `SELECT file_path, mime_type, file_size FROM evidence_recordings
       WHERE id = $1 AND sos_event_id = $2`,
      [chunkId, sosEventId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Chunk not found' });
    }

    const { file_path, mime_type, file_size } = result.rows[0];

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ success: false, message: 'Audio file not found on disk' });
    }

    const stat = fs.statSync(file_path);
    const fileSize = stat.size;
    const rangeHeader = req.headers.range;

    res.setHeader('Content-Type', mime_type || 'audio/webm');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Accept-Ranges', 'bytes');

    if (rangeHeader) {
      // Partial content (seek support)
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end   = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      res.status(206);
      res.setHeader('Content-Range',  `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunkSize);

      const stream = fs.createReadStream(file_path, { start, end });
      stream.pipe(res);
    } else {
      res.setHeader('Content-Length', fileSize);
      fs.createReadStream(file_path).pipe(res);
    }
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/evidence/:sosEventId  [admin]
 * Deletes all evidence files and records for a SOS event.
 */
export const deleteEvidence = async (req, res, next) => {
  try {
    const { sosEventId } = req.params;

    const result = await db.query(
      `SELECT id, file_path FROM evidence_recordings WHERE sos_event_id = $1`,
      [sosEventId]
    );

    let deletedCount = 0;
    for (const row of result.rows) {
      try {
        fs.unlinkSync(row.file_path);
        deletedCount++;
      } catch (e) {
        if (e.code !== 'ENOENT') console.warn('[Evidence] Delete file error:', e.message);
      }
    }

    // Attempt to remove the empty directory
    const evidenceDir = path.join(UPLOAD_BASE, 'evidence', sosEventId);
    try {
      fs.rmdirSync(evidenceDir);
    } catch {
      /* ignore — directory may not be empty or may not exist */
    }

    await db.query(
      `DELETE FROM evidence_recordings WHERE sos_event_id = $1`,
      [sosEventId]
    );

    return res.status(200).json({
      success: true,
      message: 'Evidence deleted',
      data: { deletedCount },
    });
  } catch (err) {
    next(err);
  }
};
