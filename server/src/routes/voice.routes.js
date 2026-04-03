import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getSettings,
  updateSettings,
  getKeywords,
  addKeyword,
  removeKeyword,
  triggerFromVoice,
} from '../controllers/voice.controller.js';

const router = express.Router();

// All voice endpoints require JWT authentication
router.use(authenticate);

// Settings
router.get('/settings',       getSettings);
router.put('/settings',       updateSettings);

// Keyword management
router.get('/keywords',       getKeywords);
router.post('/keywords',      addKeyword);
router.delete('/keywords/:id', removeKeyword);

// Voice trigger — fired by frontend when keyword match detected
router.post('/trigger',       triggerFromVoice);

export default router;
