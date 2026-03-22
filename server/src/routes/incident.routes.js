import { Router } from 'express';
import * as incidentController from '../controllers/incident.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { reportIncidentSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);

// GET /api/incidents/nearby
router.get('/nearby', incidentController.getNearby);

// POST /api/incidents
router.post('/', validate(reportIncidentSchema), incidentController.create);

// GET /api/incidents/:id
router.get('/:id', incidentController.getOne);

export default router;
