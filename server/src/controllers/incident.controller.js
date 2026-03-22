import * as incidentsQuery from '../db/queries/incidents.queries.js';
import * as locationService from '../services/location.service.js';

/**
 * GET /api/incidents/nearby
 * Query: lat, lng, radius (metres, default 1000)
 */
export const getNearby = async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = Math.min(parseFloat(req.query.radius) || 1000, 50000);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(422).json({ success: false, message: 'lat and lng query params are required.' });
    }

    const incidents = await locationService.findNearbyIncidents(lat, lng, radius);
    return res.status(200).json({ success: true, data: { incidents, count: incidents.length } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/incidents
 */
export const create = async (req, res, next) => {
  try {
    const { latitude, longitude, category, description, anonymous, occurred_at } = req.validatedBody;

    const incident = await incidentsQuery.createIncident({
      reportedBy: req.user.id,
      latitude,
      longitude,
      category,
      description,
      anonymous: anonymous || false,
      occurredAt: occurred_at,
    });

    return res.status(201).json({
      success: true,
      message: 'Incident reported.',
      data: { incident },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/incidents/:id
 */
export const getOne = async (req, res, next) => {
  try {
    const incident = await incidentsQuery.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }
    return res.status(200).json({ success: true, data: { incident } });
  } catch (err) {
    next(err);
  }
};
