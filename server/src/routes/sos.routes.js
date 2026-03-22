import { Router } from 'express';
import * as sosController from '../controllers/sos.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { sosLimiter } from '../middleware/rateLimiter.middleware.js';
import { triggerSOSSchema, locationPingSchema, resolveSOSSchema } from '../validators/schemas.js';

const router = Router();

// All SOS routes require authentication
router.use(authenticate);

// GET /api/sos/history  — must be before /:eventId routes
router.get('/history', sosController.getHistory);

// POST /api/sos/trigger
router.post('/trigger', sosLimiter, validate(triggerSOSSchema), sosController.trigger);

// POST /api/sos/:eventId/location
router.post('/:eventId/location', validate(locationPingSchema), sosController.addLocation);

// GET /api/sos/:eventId/location
router.get('/:eventId/location', sosController.getLatestLocation);

// PATCH /api/sos/:eventId/resolve
router.patch('/:eventId/resolve', sosController.resolve);

export default router;
