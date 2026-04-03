import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_BASE = process.env.UPLOAD_DIR || './uploads';

export const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

export const evidenceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sosEventId = req.params.sosEventId || req.body.sosEventId;
    const dir = path.join(UPLOAD_BASE, 'evidence', sosEventId);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.includes('webm') ? '.webm'
              : file.mimetype.includes('ogg')  ? '.ogg'
              : file.mimetype.includes('mp4')  ? '.mp4'
              : '.audio';
    cb(null, `chunk_${Date.now()}_${uuidv4().slice(0, 8)}${ext}`);
  },
});

const maxSizeMB = parseInt(process.env.MAX_EVIDENCE_CHUNK_SIZE_MB || '10', 10);

export const evidenceUpload = multer({
  storage: evidenceStorage,
  limits: { fileSize: maxSizeMB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/webm', 'audio/ogg', 'video/webm', 'audio/mp4', 'video/mp4'];
    cb(null, allowed.includes(file.mimetype));
  },
});
