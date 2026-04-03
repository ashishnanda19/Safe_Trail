import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireEvidenceAccess } from '../middleware/evidenceAccess.middleware.js';
import { evidenceUpload } from '../config/storage.js';
import {
  uploadChunk,
  listChunks,
  streamChunk,
  deleteEvidence,
} from '../controllers/evidence.controller.js';

const router = express.Router();

/**
 * POST /api/evidence/:sosEventId/chunk
 * Upload a 30-second audio chunk — SOS owner only.
 */
router.post(
  '/:sosEventId/chunk',
  authenticate,
  requireEvidenceAccess('owner'),
  evidenceUpload.single('chunk'),
  uploadChunk
);

/**
 * GET /api/evidence/:sosEventId
 * List chunk metadata — owner, guardians, admins.
 */
router.get(
  '/:sosEventId',
  authenticate,
  requireEvidenceAccess('viewer'),
  listChunks
);

/**
 * GET /api/evidence/:sosEventId/chunk/:chunkId
 * Stream a single audio chunk — owner, guardians, admins.
 */
router.get(
  '/:sosEventId/chunk/:chunkId',
  authenticate,
  requireEvidenceAccess('viewer'),
  streamChunk
);

/**
 * DELETE /api/evidence/:sosEventId
 * Delete all evidence — admin only.
 */
router.delete(
  '/:sosEventId',
  authenticate,
  requireEvidenceAccess('admin'),
  deleteEvidence
);

export default router;
