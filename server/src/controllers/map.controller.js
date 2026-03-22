import * as mapService from '../services/map.service.js';
import * as heatmapService from '../services/heatmap.service.js';

/**
 * GET /api/map/nearby?lat&lng&type&radius
 */
export const getNearby = async (req, res, next) => {
  try {
    const { lat, lng, type, radius } = req.validatedQuery;
    const places = await mapService.findNearbyPlaces(lat, lng, radius, type);

    // Add distance from query origin to each place
    const enriched = places.map(p => {
      const dist = Math.round(
        6371000 * 2 * Math.atan2(
          Math.sqrt(
            Math.sin(((p.lat - lat) * Math.PI / 180) / 2) ** 2 +
            Math.cos(lat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) *
            Math.sin(((p.lng - lng) * Math.PI / 180) / 2) ** 2
          ),
          Math.sqrt(1 - (
            Math.sin(((p.lat - lat) * Math.PI / 180) / 2) ** 2 +
            Math.cos(lat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) *
            Math.sin(((p.lng - lng) * Math.PI / 180) / 2) ** 2
          ))
        )
      );
      const distText = dist < 1000 ? `${dist} m` : `${(dist / 1000).toFixed(1)} km`;
      return { ...p, distanceMetres: dist, distanceText: distText };
    }).sort((a, b) => a.distanceMetres - b.distanceMetres);

    return res.status(200).json({ success: true, data: { places: enriched, count: enriched.length } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/map/nearest?lat&lng&type
 */
export const getNearest = async (req, res, next) => {
  try {
    const { lat, lng, type, radius } = req.validatedQuery;
    const place = await mapService.getNearestPlace(lat, lng, type, radius);

    if (!place) {
      return res.status(404).json({ success: false, message: `No ${type} found near this location.` });
    }

    return res.status(200).json({ success: true, data: { place } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/map/route?originLat&originLng&destLat&destLng&profile
 */
export const getRoute = async (req, res, next) => {
  try {
    const { originLat, originLng, destLat, destLng, profile } = req.validatedQuery;
    const route = await mapService.getRoute(originLat, originLng, destLat, destLng, profile);
    return res.status(200).json({ success: true, data: { route } });
  } catch (err) {
    if (err.message.includes('Route not found')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * GET /api/map/geocode/reverse?lat&lng
 */
export const reverseGeocode = async (req, res, next) => {
  try {
    const { lat, lng } = req.validatedQuery;
    const address = await mapService.reverseGeocode(lat, lng);
    return res.status(200).json({ success: true, data: { address } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/map/live/:sosEventId  — GeoJSON trail
 */
export const getLivePings = async (req, res, next) => {
  try {
    const geoJSON = await mapService.getLivePings(req.params.sosEventId);
    return res.status(200).json({ success: true, data: geoJSON });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/map/live/:sosEventId/latest
 */
export const getLatestPing = async (req, res, next) => {
  try {
    const { db } = await import('../config/db.js');
    const result = await db.query(
      `SELECT
         ST_X(coordinates::geometry) AS longitude,
         ST_Y(coordinates::geometry) AS latitude,
         accuracy, pinged_at
       FROM location_pings
       WHERE sos_event_id = $1
       ORDER BY pinged_at DESC LIMIT 1`,
      [req.params.sosEventId]
    );
    const ping = result.rows[0] || null;
    if (!ping) return res.status(404).json({ success: false, message: 'No pings found.' });
    return res.status(200).json({ success: true, data: { ping } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/map/heatmap?minLat&maxLat&minLng&maxLng  [admin only]
 */
export const getHeatmap = async (req, res, next) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.validatedQuery;
    const clusters = await heatmapService.getIncidentHeatmap({ minLat, maxLat, minLng, maxLng });
    return res.status(200).json({ success: true, data: { clusters } });
  } catch (err) {
    next(err);
  }
};
