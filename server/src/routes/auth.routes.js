import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.middleware.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';

const router = Router();

// POST /api/auth/register
router.post('/register', registerLimiter, validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

// POST /api/auth/logout  [JWT required]
router.post('/logout', authenticate, authController.logout);

export default router;
