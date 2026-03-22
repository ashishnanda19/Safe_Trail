import { db } from '../config/db.js';

/**
 * Get incident clusters for heatmap rendering.
 * Uses ST_SnapToGrid to group incidents into ~1km cells.
 */
export const getIncidentHeatmap = async ({ minLat, maxLat, minLng, maxLng }) => {
  const result = await db.query(
    `SELECT
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
     ORDER BY incident_count DESC`,
    [minLng, minLat, maxLng, maxLat]
  );

  return result.rows.map(r => ({
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lng),
    category: r.category,
    weight: parseInt(r.incident_count),
    latestIncident: r.latest_incident,
  }));
};
