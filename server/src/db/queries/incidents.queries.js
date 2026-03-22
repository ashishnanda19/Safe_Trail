import { db } from '../../config/db.js';

export const createIncident = async ({ reportedBy, latitude, longitude, category, description, anonymous, occurredAt }) => {
  const location = `SRID=4326;POINT(${longitude} ${latitude})`;
  const result = await db.query(
    `INSERT INTO incidents (reported_by, location, category, description, anonymous, occurred_at)
     VALUES ($1, ST_GeomFromEWKT($2), $3, $4, $5, $6)
     RETURNING id, category, description, anonymous, occurred_at, created_at,
               ST_X(location::geometry) AS longitude,
               ST_Y(location::geometry) AS latitude`,
    [anonymous ? null : reportedBy, location, category, description || null, anonymous, occurredAt]
  );
  return result.rows[0];
};

export const findById = async (id) => {
  const result = await db.query(
    `SELECT
       id, category, description, anonymous, occurred_at, created_at,
       CASE WHEN anonymous THEN NULL ELSE reported_by END AS reported_by,
       ST_X(location::geometry) AS longitude,
       ST_Y(location::geometry) AS latitude
     FROM incidents WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};
