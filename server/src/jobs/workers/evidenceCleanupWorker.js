import { Worker } from 'bullmq';
import fs from 'fs';
import path from 'path';
import { bullmqRedis } from '../../config/redis.js';
import { db } from '../../config/db.js';
import { evidenceCleanupQueue } from '../queues.js';

const UPLOAD_BASE = process.env.UPLOAD_DIR || './uploads';
const RETENTION_DAYS = parseInt(process.env.EVIDENCE_RETENTION_DAYS || '30', 10);

/**
 * Evidence cleanup worker — runs daily via BullMQ cron.
 * Deletes audio files and DB records older than RETENTION_DAYS.
 */
const evidenceCleanupWorker = new Worker(
  'evidenceCleanup',
  async (job) => {
    console.log(`[EvidenceCleanup] Starting cleanup — retaining last ${RETENTION_DAYS} days`);

    const result = await db.query(
      `SELECT id, file_path FROM evidence_recordings
       WHERE created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'`
    );

    if (result.rows.length === 0) {
      console.log('[EvidenceCleanup] Nothing to clean up');
      return;
    }

    let deletedFiles = 0;
    const sosEventIds = new Set();

    for (const row of result.rows) {
      // Extract sosEventId from path for directory cleanup
      const parts = row.file_path.split(path.sep);
      const evidenceIdx = parts.indexOf('evidence');
      if (evidenceIdx >= 0 && parts[evidenceIdx + 1]) {
        sosEventIds.add(parts[evidenceIdx + 1]);
      }

      try {
        fs.unlinkSync(row.file_path);
        deletedFiles++;
      } catch (e) {
        if (e.code !== 'ENOENT') {
          console.warn('[EvidenceCleanup] Could not delete file:', row.file_path, e.message);
        }
      }
    }

    // Delete stale DB records
    await db.query(
      `DELETE FROM evidence_recordings
       WHERE created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'`
    );

    // Attempt to clean up empty event directories
    for (const eventId of sosEventIds) {
      const dir = path.join(UPLOAD_BASE, 'evidence', eventId);
      try {
        const remaining = fs.readdirSync(dir);
        if (remaining.length === 0) fs.rmdirSync(dir);
      } catch {
        /* ignore */
      }
    }

    console.log(`[EvidenceCleanup] Done. Deleted ${deletedFiles} files.`);
  },
  { connection: bullmqRedis }
);

evidenceCleanupWorker.on('failed', (job, err) => {
  console.error('[EvidenceCleanup] Job failed:', err.message);
});

// Schedule the cron job (2AM daily)
evidenceCleanupQueue.add(
  'cleanup',
  {},
  {
    repeat: { pattern: '0 2 * * *' },
    jobId: 'evidence-cleanup-cron', // stable ID prevents duplicate registrations
  }
).catch(err => console.warn('[EvidenceCleanup] Failed to schedule cron:', err.message));

export default evidenceCleanupWorker;
