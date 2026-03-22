import { Router } from 'express';
import * as mapController from '../controllers/map.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { mapNearbyLimiter, mapRouteLimiter, heatmapLimiter } from '../middleware/rateLimiter.middleware.js';
import { nearbySchema, nearestSchema, routeSchema, reverseGeocodeSchema, heatmapSchema } from '../validators/map.validators.js';

const router = Router();

router.use(authenticate);

// GET /api/map/nearby
router.get('/nearby', mapNearbyLimiter, validate(nearbySchema, 'query'), mapController.getNearby);

// GET /api/map/nearest
router.get('/nearest', mapNearbyLimiter, validate(nearestSchema, 'query'), mapController.getNearest);

// GET /api/map/route
router.get('/route', mapRouteLimiter, validate(routeSchema, 'query'), mapController.getRoute);

// GET /api/map/geocode/reverse
router.get('/geocode/reverse', validate(reverseGeocodeSchema, 'query'), mapController.reverseGeocode);

// GET /api/map/live/:sosEventId  — full GeoJSON trail
router.get('/live/:sosEventId', mapController.getLivePings);

// GET /api/map/live/:sosEventId/latest
router.get('/live/:sosEventId/latest', mapController.getLatestPing);

// GET /api/map/heatmap  [admin only]
router.get('/heatmap', requireRole('admin'), heatmapLimiter, validate(heatmapSchema, 'query'), mapController.getHeatmap);

export default router;
