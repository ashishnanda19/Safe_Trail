import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateUserSchema, locationSchema } from '../validators/schemas.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/users/me
router.get('/me', userController.getMe);

// PATCH /api/users/me
router.patch('/me', validate(updateUserSchema), userController.updateMe);

// PATCH /api/users/me/location
router.patch('/me/location', validate(locationSchema), userController.updateLocation);

export default router;
