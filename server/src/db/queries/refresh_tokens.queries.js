import { db } from '../../config/db.js';

/**
 * Store a new refresh token (store only the SHA-256 hash, never raw token)
 */
export const createToken = async ({ userId, tokenHash, expiresAt }) => {
  const result = await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
};

/**
 * Find a refresh token record by its hash
 */
export const findByHash = async (tokenHash) => {
  const result = await db.query(
    `SELECT id, user_id, token_hash, expires_at, is_revoked
     FROM refresh_tokens
     WHERE token_hash = $1`,
    [tokenHash]
  );
  return result.rows[0] || null;
};

/**
 * Revoke a specific refresh token by its hash
 */
export const revokeToken = async (tokenHash) => {
  await db.query(
    `UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1`,
    [tokenHash]
  );
};

/**
 * Revoke ALL refresh tokens for a user (used when password changes or full logout)
 */
export const revokeAllForUser = async (userId) => {
  await db.query(
    `UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1`,
    [userId]
  );
};

/**
 * Delete expired tokens (called periodically for cleanup)
 */
export const deleteExpired = async () => {
  const result = await db.query(
    `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = true
     RETURNING id`
  );
  return result.rowCount;
};
