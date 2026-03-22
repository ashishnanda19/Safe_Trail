import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import * as refreshTokensQuery from '../db/queries/refresh_tokens.queries.js';

/**
 * Sign a short-lived access token (15 min TTL)
 */
export const signAccessToken = (payload) => {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  });
};

/**
 * Sign a refresh token (7 day TTL)
 */
export const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  });
};

/**
 * Verify an access token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET);
};

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
};

/**
 * Hash a token with SHA-256 — only the hash is stored in DB
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Issue a new access + refresh token pair for a user.
 * Stores the refresh token hash in the DB.
 */
export const issueTokens = async (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ id: user.id });
  const tokenHash = hashToken(refreshToken);

  // Parse expiry: 7d → 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await refreshTokensQuery.createToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

/**
 * Rotate a refresh token:
 * 1. Verify the incoming refresh token
 * 2. Hash it and look it up in DB (must be valid, not revoked, not expired)
 * 3. Revoke the old token
 * 4. Issue a new token pair
 */
export const rotateRefreshToken = async (refreshToken, user) => {
  const tokenHash = hashToken(refreshToken);
  const stored = await refreshTokensQuery.findByHash(tokenHash);

  if (!stored) {
    const err = new Error('Refresh token not found. Please log in again.');
    err.statusCode = 401;
    throw err;
  }

  if (stored.is_revoked) {
    // Token reuse detected — revoke ALL tokens for this user (security measure)
    await refreshTokensQuery.revokeAllForUser(stored.user_id);
    const err = new Error('Refresh token reuse detected. All sessions revoked. Please log in again.');
    err.statusCode = 401;
    throw err;
  }

  if (new Date(stored.expires_at) < new Date()) {
    const err = new Error('Refresh token has expired. Please log in again.');
    err.statusCode = 401;
    throw err;
  }

  // Revoke old token
  await refreshTokensQuery.revokeToken(tokenHash);

  // Issue new pair
  return issueTokens(user);
};

/**
 * Revoke a refresh token (logout)
 */
export const revokeRefreshToken = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);
  await refreshTokensQuery.revokeToken(tokenHash);
};
