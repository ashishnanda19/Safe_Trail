import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { heatmapLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// All admin routes are double-gated: JWT + admin role
router.use(authenticate, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', adminController.getStats);

// GET /api/admin/heatmap
router.get('/heatmap', heatmapLimiter, adminController.getHeatmap);

// GET /api/admin/sos/active
router.get('/sos/active', adminController.getActiveSOS);

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', adminController.updateUserRole);

export default router;
