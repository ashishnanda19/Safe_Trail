import { db } from '../config/db.js';

/**
 * GET /api/admin/stats
 */
export const getStats = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM sos_events) AS total_sos_events,
        (SELECT COUNT(*) FROM sos_events WHERE status = 'active') AS active_sos_count,
        (SELECT COUNT(*) FROM incidents) AS total_incidents,
        (SELECT COUNT(*) FROM users WHERE is_active = true) AS total_users,
        (
          SELECT ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - triggered_at))))::INT
          FROM sos_events
          WHERE status = 'resolved' AND resolved_at IS NOT NULL
        ) AS avg_response_time_seconds
    `);

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/sos/active
 */
export const getActiveSOS = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        se.id, se.user_id, se.status, se.triggered_at,
        ST_X(se.triggered_location::geometry) AS trigger_longitude,
        ST_Y(se.triggered_location::geometry) AS trigger_latitude,
        u.name AS user_name, u.phone AS user_phone,
        lp.last_latitude, lp.last_longitude, lp.last_ping_at
      FROM sos_events se
      JOIN users u ON u.id = se.user_id
      LEFT JOIN LATERAL (
        SELECT
          ST_Y(coordinates::geometry) AS last_latitude,
          ST_X(coordinates::geometry) AS last_longitude,
          pinged_at AS last_ping_at
        FROM location_pings
        WHERE sos_event_id = se.id
        ORDER BY pinged_at DESC
        LIMIT 1
      ) lp ON true
      WHERE se.status = 'active'
      ORDER BY se.triggered_at DESC
    `);

    return res.status(200).json({ success: true, data: { activeSOS: result.rows } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/heatmap
 */
export const getHeatmap = async (req, res, next) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;

    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(422).json({
        success: false,
        message: 'Required query params: minLat, maxLat, minLng, maxLng',
      });
    }

    const result = await db.query(`
      SELECT
        ST_X(ST_SnapToGrid(location::geometry, 0.01)) AS lng,
        ST_Y(ST_SnapToGrid(location::geometry, 0.01)) AS lat,
        category,
        COUNT(*) AS incident_count,
        MAX(occurred_at) AS latest_incident
      FROM incidents
      WHERE ST_Within(
        location::geometry,
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      )
      GROUP BY ST_SnapToGrid(location::geometry, 0.01), category
      ORDER BY incident_count DESC
    `, [parseFloat(minLng), parseFloat(minLat), parseFloat(maxLng), parseFloat(maxLat)]);

    const clusters = result.rows.map(r => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      category: r.category,
      weight: parseInt(r.incident_count),
      latestIncident: r.latest_incident,
    }));

    return res.status(200).json({ success: true, data: { clusters } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/role
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'volunteer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(422).json({ success: false, message: `Role must be one of: ${validRoles.join(', ')}` });
    }

    const result = await db.query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, name, email, role`,
      [role, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, data: { user: result.rows[0] }, message: 'Role updated.' });
  } catch (err) {
    next(err);
  }
};
