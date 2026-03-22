import { db } from '../../config/db.js';

/**
 * Create a new user
 */
export const createUser = async ({ name, email, phone, passwordHash, role = 'user' }) => {
  const result = await db.query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, phone, role, is_active, created_at, updated_at`,
    [name, email, phone, passwordHash, role]
  );
  return result.rows[0];
};

/**
 * Find user by email (includes password_hash for auth)
 */
export const findByEmail = async (email) => {
  const result = await db.query(
    `SELECT id, name, email, phone, password_hash, role, fcm_token, is_active, created_at
     FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

/**
 * Find user by ID (excludes password_hash for safety)
 */
export const findById = async (id) => {
  const result = await db.query(
    `SELECT id, name, email, phone, role, fcm_token, is_active, created_at, updated_at,
            ST_X(last_location::geometry) AS longitude,
            ST_Y(last_location::geometry) AS latitude
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Find user by phone number
 */
export const findByPhone = async (phone) => {
  const result = await db.query(
    `SELECT id, name, email, phone, role, fcm_token, is_active
     FROM users WHERE phone = $1`,
    [phone]
  );
  return result.rows[0] || null;
};

/**
 * Update user profile fields
 */
export const updateUser = async (id, fields) => {
  const allowedFields = ['name', 'phone', 'fcm_token'];
  const updates = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (allowedFields.includes(key) && value !== undefined) {
      const columnName = key === 'fcm_token' ? 'fcm_token' : key;
      updates.push(`${columnName} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (updates.length === 0) return null;

  values.push(id);
  const result = await db.query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING id, name, email, phone, role, fcm_token, is_active, updated_at`,
    values
  );
  return result.rows[0];
};

/**
 * Update user's last known location (PostGIS)
 */
export const updateLocation = async (id, latitude, longitude) => {
  const result = await db.query(
    `UPDATE users
     SET last_location = ST_SetSRID(ST_MakePoint($1, $2), 4326), updated_at = NOW()
     WHERE id = $3
     RETURNING id`,
    [longitude, latitude, id]
  );
  return result.rows[0];
};

/**
 * Update user role (admin action)
 */
export const updateRole = async (id, role) => {
  const result = await db.query(
    `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, name, email, role`,
    [role, id]
  );
  return result.rows[0];
};
