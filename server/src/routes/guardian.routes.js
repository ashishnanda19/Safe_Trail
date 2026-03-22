import { Router } from 'express';
import * as guardianController from '../controllers/guardian.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { addGuardianSchema } from '../validators/schemas.js';

const router = Router();

// All guardian routes require authentication
router.use(authenticate);

// GET /api/guardians
router.get('/', guardianController.listGuardians);

// GET /api/guardians/invites
router.get('/invites', guardianController.listInvites);

// POST /api/guardians
router.post('/', validate(addGuardianSchema), guardianController.addGuardian);

// PATCH /api/guardians/:circleId/accept
router.patch('/:circleId/accept', guardianController.acceptInvite);

// DELETE /api/guardians/:guardianId
router.delete('/:guardianId', guardianController.removeGuardian);

export default router;
