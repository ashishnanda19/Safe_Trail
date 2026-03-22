import { db } from '../../config/db.js';

/**
 * Add a guardian relationship (pending)
 */
export const addGuardian = async (userId, guardianId) => {
  const result = await db.query(
    `INSERT INTO guardian_circles (user_id, guardian_id, status)
     VALUES ($1, $2, 'pending')
     RETURNING *`,
    [userId, guardianId]
  );
  return result.rows[0];
};

/**
 * List all guardians for a user (accepted and pending), with their full profile
 */
export const listMyGuardians = async (userId) => {
  const result = await db.query(
    `SELECT u.id, u.name, u.email, u.phone, u.fcm_token,
            gc.id AS circle_id, gc.status, gc.created_at AS added_at,
            ST_X(u.last_location::geometry) AS longitude,
            ST_Y(u.last_location::geometry) AS latitude
     FROM guardian_circles gc
     JOIN users u ON u.id = gc.guardian_id
     WHERE gc.user_id = $1 AND gc.status IN ('accepted', 'pending')
     ORDER BY gc.status ASC, gc.created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * List all pending invites received by a guardian
 */
export const listPendingInvites = async (guardianId) => {
  const result = await db.query(
    `SELECT gc.id AS circle_id, gc.status, gc.created_at,
            u.id, u.name, u.email, u.phone
     FROM guardian_circles gc
     JOIN users u ON u.id = gc.user_id
     WHERE gc.guardian_id = $1 AND gc.status = 'pending'
     ORDER BY gc.created_at DESC`,
    [guardianId]
  );
  return result.rows;
};

/**
 * Find a specific relationship by circle ID
 */
export const findByCircleId = async (circleId) => {
  const result = await db.query(
    `SELECT * FROM guardian_circles WHERE id = $1`,
    [circleId]
  );
  return result.rows[0] || null;
};

/**
 * Update status (accept/reject)
 */
export const updateStatus = async (circleId, status) => {
  const result = await db.query(
    `UPDATE guardian_circles SET status = $1 WHERE id = $2
     RETURNING *`,
    [status, circleId]
  );
  return result.rows[0];
};

/**
 * Remove a guardian relationship
 */
export const remove = async (userId, guardianId) => {
  const result = await db.query(
    `DELETE FROM guardian_circles
     WHERE (user_id = $1 AND guardian_id = $2) OR (user_id = $2 AND guardian_id = $1)
     RETURNING id`,
    [userId, guardianId]
  );
  return result.rowCount > 0;
};

/**
 * Get all accepted guardians for a user (used by SOS service for fan-out)
 */
export const getAcceptedGuardians = async (userId) => {
  const result = await db.query(
    `SELECT u.id, u.name, u.phone, u.fcm_token
     FROM users u
     JOIN guardian_circles gc ON gc.guardian_id = u.id
     WHERE gc.user_id = $1 AND gc.status = 'accepted'`,
    [userId]
  );
  return result.rows;
};
