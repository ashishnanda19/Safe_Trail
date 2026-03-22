import { db } from '../config/db.js';

/**
 * Find incidents within a radius using PostGIS geography ST_DWithin
 * Returns incidents sorted by distance (nearest first)
 */
export const findNearbyIncidents = async (lat, lng, radiusMetres = 1000) => {
  const result = await db.query(
    `SELECT
       i.id, i.category, i.description, i.anonymous, i.occurred_at, i.created_at,
       CASE WHEN i.anonymous THEN NULL ELSE i.reported_by END AS reported_by,
       ST_X(i.location::geometry) AS longitude,
       ST_Y(i.location::geometry) AS latitude,
       ST_Distance(
         i.location::geography,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
       ) AS distance_metres
     FROM incidents i
     WHERE ST_DWithin(
       i.location::geography,
       ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
       $3
     )
     ORDER BY distance_metres ASC
     LIMIT 100`,
    [lng, lat, radiusMetres]
  );
  return result.rows;
};
