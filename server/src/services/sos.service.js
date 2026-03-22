import { db } from '../config/db.js';
import { alertQueue } from '../jobs/queues.js';
import { emitToRoom } from '../sockets/index.js';
import { getNearestPlace } from './map.service.js';

/**
 * CORE FAN-OUT — triggers SOS and notifies all guardians in parallel.
 * This is the most critical function in the entire backend.
 */
export const triggerSOS = async (userId, { latitude, longitude }, userName) => {
  const location = `SRID=4326;POINT(${longitude} ${latitude})`;

  // 1. Insert SOS event and fetch guardians simultaneously
  const [sosResult, guardiansResult] = await Promise.all([
    db.query(
      `INSERT INTO sos_events (user_id, triggered_location)
       VALUES ($1, ST_GeomFromEWKT($2))
       RETURNING *`,
      [userId, location]
    ),
    db.query(
      `SELECT u.id, u.name, u.phone, u.fcm_token
       FROM users u
       JOIN guardian_circles gc ON gc.guardian_id = u.id
       WHERE gc.user_id = $1 AND gc.status = 'accepted'`,
      [userId]
    ),
  ]);

  const event = sosResult.rows[0];
  const guardians = guardiansResult.rows;

  // 2. Fan-out — socket broadcast + job enqueueing + nearest places lookup happen in parallel
  // None of these block the HTTP response (we don't await the full chain)
  const fanOutPromises = [
    // Real-time broadcast to the SOS room
    emitToRoom(`sos:${userId}`, 'sos:triggered', {
      sosEventId: event.id,
      userId,
      location: { latitude, longitude },
      triggeredAt: event.triggered_at,
    }),

    // Pre-fetch nearest hospital and police for richer SMS content
    Promise.all([
      getNearestPlace(latitude, longitude, 'hospital'),
      getNearestPlace(latitude, longitude, 'police'),
    ]).then(async ([nearestHospital, nearestPolice]) => {
      // Enqueue one alert job per guardian with nearest place info embedded
      await Promise.all(
        guardians.map(guardian =>
          alertQueue.add(
            'send-alert',
            {
              sosEventId: event.id,
              guardianId: guardian.id,
              guardianPhone: guardian.phone,
              guardianFcmToken: guardian.fcm_token,
              userId,
              userName,
              location: { latitude, longitude },
              nearestHospital,
              nearestPolice,
            },
            {
              attempts: 3,
              backoff: { type: 'exponential', delay: 2000 },
            }
          )
        )
      );
    }).catch(err => console.error('[SOS] Alert job enqueue error:', err.message)),
  ];

  // Intentionally do NOT await the full fan-out — return sosEventId immediately
  Promise.all(fanOutPromises).catch(err =>
    console.error('[SOS] Fan-out error (non-fatal):', err.message)
  );

  return {
    sosEventId: event.id,
    status: event.status,
    triggeredAt: event.triggered_at,
    guardianCount: guardians.length,
  };
};

/**
 * Add a location ping during an active SOS and broadcast to map room
 */
export const addLocationPing = async (sosEventId, { latitude, longitude, accuracy }) => {
  const coordinates = `SRID=4326;POINT(${longitude} ${latitude})`;

  const result = await db.query(
    `INSERT INTO location_pings (sos_event_id, coordinates, accuracy)
     VALUES ($1, ST_GeomFromEWKT($2), $3)
     RETURNING id, sos_event_id, accuracy, pinged_at`,
    [sosEventId, coordinates, accuracy || null]
  );

  const ping = result.rows[0];

  // Broadcast to all guardians watching this SOS
  emitToRoom(`map:${sosEventId}`, 'map:position', {
    sosEventId,
    latitude,
    longitude,
    accuracy,
    timestamp: ping.pinged_at,
  });

  return ping;
};

/**
 * Get the latest location ping for an SOS event
 */
export const getLatestPing = async (sosEventId) => {
  const result = await db.query(
    `SELECT
       id,
       ST_X(coordinates::geometry) AS longitude,
       ST_Y(coordinates::geometry) AS latitude,
       accuracy,
       pinged_at
     FROM location_pings
     WHERE sos_event_id = $1
     ORDER BY pinged_at DESC
     LIMIT 1`,
    [sosEventId]
  );
  return result.rows[0] || null;
};

/**
 * Get all location pings as GeoJSON FeatureCollection (for movement trail)
 */
export const getAllPings = async (sosEventId) => {
  const result = await db.query(
    `SELECT
       id,
       ST_X(coordinates::geometry) AS longitude,
       ST_Y(coordinates::geometry) AS latitude,
       accuracy,
       pinged_at
     FROM location_pings
     WHERE sos_event_id = $1
     ORDER BY pinged_at ASC`,
    [sosEventId]
  );

  return {
    type: 'FeatureCollection',
    features: result.rows.map(r => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [parseFloat(r.longitude), parseFloat(r.latitude)] },
      properties: { accuracy: r.accuracy, pingedAt: r.pinged_at },
    })),
  };
};

/**
 * Resolve an active SOS event
 */
export const resolveSOS = async (sosEventId, userId, notes) => {
  const result = await db.query(
    `UPDATE sos_events
     SET status = 'resolved', resolved_at = NOW(), notes = $1
     WHERE id = $2 AND user_id = $3 AND status = 'active'
     RETURNING *`,
    [notes || null, sosEventId, userId]
  );

  if (!result.rows[0]) return null;

  const event = result.rows[0];

  // Notify all guardians watching via socket
  emitToRoom(`sos:${userId}`, 'sos:resolved', { sosEventId, resolvedAt: event.resolved_at });
  emitToRoom(`map:${sosEventId}`, 'map:tracking-ended', { sosEventId });

  return event;
};

/**
 * Get paginated SOS history for a user
 */
export const getSOSHistory = async (userId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const [eventsResult, countResult] = await Promise.all([
    db.query(
      `SELECT
         id, status, triggered_at, resolved_at, notes,
         ST_X(triggered_location::geometry) AS longitude,
         ST_Y(triggered_location::geometry) AS latitude
       FROM sos_events
       WHERE user_id = $1
       ORDER BY triggered_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    db.query(
      `SELECT COUNT(*) FROM sos_events WHERE user_id = $1`,
      [userId]
    ),
  ]);

  return {
    events: eventsResult.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count),
    },
  };
};
