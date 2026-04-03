import { redis } from '../config/redis.js';
import { env } from '../config/env.js';

// Nominatim rate limiting — 1 request per second per their usage policy
let lastNominatimRequest = 0;
const nominatimDelay = async () => {
  const now = Date.now();
  const elapsed = now - lastNominatimRequest;
  if (elapsed < 1000) {
    await new Promise(r => setTimeout(r, 1000 - elapsed));
  }
  lastNominatimRequest = Date.now();
};

/**
 * Haversine formula for straight-line distance in metres
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDuration = (seconds) => {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''}`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs} hr${hrs !== 1 ? 's' : ''} ${rem} min${rem !== 1 ? 's' : ''}`;
};

const formatDistance = (metres) => {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
};

/**
 * OpenStreetMap Overpass API Endpoints (tried in parallel)
 */
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
];

/**
 * Parse raw Overpass elements into a uniform place shape
 */
const parseOverpassElements = (elements, amenityType) =>
  elements
    .map(el => {
      const pLat = el.lat ?? el.center?.lat;
      const pLng = el.lon ?? el.center?.lon;
      if (!pLat || !pLng) return null;
      return {
        id: el.id,
        name: el.tags?.name || `Unnamed ${amenityType}`,
        type: amenityType,
        lat: pLat,
        lng: pLng,
        address:
          [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ') || null,
        phone: el.tags?.phone || null,
        openingHours: el.tags?.opening_hours || null,
      };
    })
    .filter(Boolean);

/**
 * Query all Overpass endpoints in parallel; resolve on first success.
 * Max wait: 12 seconds (instead of 3 × 15 = 45 seconds sequential).
 */
const fetchFromOverpass = async (query) => {
  const data = await Promise.any(
    OVERPASS_ENDPOINTS.map(async (endpoint) => {
      const url = `${endpoint}?data=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'SafeTraiL-App/1.0 (safety@safetrail.app)' },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${endpoint}`);
      return res.json();
    })
  );
  return data;
};

/**
 * Nominatim structured search fallback.
 * Converts center + radius to a bounding box and queries /search?amenity=...
 */
const fetchFromNominatim = async (lat, lng, radiusMetres, amenityType) => {
  await nominatimDelay();

  const deltaLat = radiusMetres / 111000;
  const deltaLng = radiusMetres / (111000 * Math.cos((lat * Math.PI) / 180));

  // Nominatim viewbox format: left,top,right,bottom  (minLng,maxLat,maxLng,minLat)
  const viewbox = [
    (lng - deltaLng).toFixed(6),
    (lat + deltaLat).toFixed(6),
    (lng + deltaLng).toFixed(6),
    (lat - deltaLat).toFixed(6),
  ].join(',');

  const url =
    `${env.NOMINATIM_API_URL}/search` +
    `?amenity=${encodeURIComponent(amenityType)}` +
    `&format=json&limit=50&bounded=1&viewbox=${viewbox}&addressdetails=1&extratags=1`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'SafeTraiL-App/1.0 (safety@safetrail.app)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Nominatim search error: ${res.status}`);

  const items = await res.json();
  return items
    .filter(item => item.lat && item.lon)
    .map(item => ({
      id: item.osm_id,
      name: item.name || item.display_name?.split(',')[0] || `Unnamed ${amenityType}`,
      type: amenityType,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.display_name || null,
      phone: item.extratags?.phone || null,
      openingHours: item.extratags?.opening_hours || null,
    }));
};

/**
 * Find nearby places — tries Overpass (parallel) then Nominatim as fallback.
 */
export const findNearbyPlaces = async (lat, lng, radiusMetres = 3000, amenityType) => {
  const cacheKey = `places:osm:${lat.toFixed(3)}:${lng.toFixed(3)}:${radiusMetres}:${amenityType}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const query = `
      [out:json][timeout:20];
      (
        node["amenity"="${amenityType}"](around:${radiusMetres},${lat},${lng});
        way["amenity"="${amenityType}"](around:${radiusMetres},${lat},${lng});
        relation["amenity"="${amenityType}"](around:${radiusMetres},${lat},${lng});
      );
      out center;
    `;

    let places;
    try {
      const data = await fetchFromOverpass(query);
      places = parseOverpassElements(data.elements || [], amenityType);
      console.info(`[MapService] Overpass returned ${places.length} results for ${amenityType}`);
    } catch (overpassErr) {
      console.warn(`[MapService] Overpass failed (${overpassErr.message}), trying Nominatim fallback`);
      places = await fetchFromNominatim(lat, lng, radiusMetres, amenityType);
      console.info(`[MapService] Nominatim returned ${places.length} results for ${amenityType}`);
    }

    await redis.setex(cacheKey, env.MAP_CACHE_TTL_PLACES, JSON.stringify(places));
    return places;
  } catch (err) {
    console.warn(`[MapService] findNearbyPlaces failed gracefully: ${err.message}`);
    return [];
  }
};

/**
 * Get optimal route via OSRM with Redis caching
 */
export const getRoute = async (originLat, originLng, destLat, destLng, profile = 'driving') => {
  const cacheKey = `route:${originLat.toFixed(4)}:${originLng.toFixed(4)}:${destLat.toFixed(4)}:${destLng.toFixed(4)}:${profile}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const url = `${env.OSRM_API_URL}/route/v1/${profile}/` +
    `${originLng},${originLat};${destLng},${destLat}` +
    `?overview=full&geometries=geojson&steps=true`;

  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const data = await response.json();

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(`Route not found: ${data.message || data.code}`);
  }

  const route = data.routes[0];
  const result = {
    distanceMetres: Math.round(route.distance),
    durationSeconds: Math.round(route.duration),
    durationText: formatDuration(route.duration),
    distanceText: formatDistance(route.distance),
    geometry: route.geometry,
    steps: route.legs[0].steps.map(s => ({
      instruction: `${s.maneuver.type} ${s.name || ''}`.trim(),
      distanceMetres: Math.round(s.distance),
      durationSeconds: Math.round(s.duration),
    })),
  };

  await redis.setex(cacheKey, env.MAP_CACHE_TTL_ROUTES, JSON.stringify(result));
  return result;
};

/**
 * Reverse geocode a coordinate via Nominatim with Redis caching
 */
export const reverseGeocode = async (lat, lng) => {
  const cacheKey = `geocode:${lat.toFixed(4)}:${lng.toFixed(4)}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Respect Nominatim's 1 req/sec rate limit
  await nominatimDelay();

  const url = `${env.NOMINATIM_API_URL}/reverse?lat=${lat}&lon=${lng}&format=json`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'SafeTraiL-App/1.0 (safety@safetrail.app)' },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status}`);
  }

  const data = await response.json();
  const result = {
    displayName: data.display_name,
    road: data.address?.road || null,
    suburb: data.address?.suburb || null,
    city: data.address?.city || data.address?.town || null,
    state: data.address?.state || null,
    postcode: data.address?.postcode || null,
  };

  await redis.setex(cacheKey, env.MAP_CACHE_TTL_GEOCODE, JSON.stringify(result));
  return result;
};

/**
 * Get the single nearest place of a given type
 */
export const getNearestPlace = async (lat, lng, amenityType, radiusMetres = 50000) => {
  try {
    const places = await findNearbyPlaces(lat, lng, radiusMetres, amenityType);
    if (!places.length) return null;

    return places
      .map(p => ({
        ...p,
        distanceMetres: Math.round(haversineDistance(lat, lng, p.lat, p.lng)),
        distanceText: formatDistance(haversineDistance(lat, lng, p.lat, p.lng)),
      }))
      .sort((a, b) => a.distanceMetres - b.distanceMetres)[0];
  } catch (err) {
    console.error(`[MapService] getNearestPlace(${amenityType}) error:`, err.message);
    return null; // Gracefully degrade — don't let map errors block SOS
  }
};

/**
 * Get all location pings for a SOS event as GeoJSON FeatureCollection
 */
export const getLivePings = async (sosEventId) => {
  const { db } = await import('../config/db.js');
  const result = await db.query(
    `SELECT
       id,
       ST_X(coordinates::geometry) AS longitude,
       ST_Y(coordinates::geometry) AS latitude,
       accuracy, pinged_at
     FROM location_pings
     WHERE sos_event_id = $1
     ORDER BY pinged_at ASC`,
    [sosEventId]
  );

  return {
    type: 'FeatureCollection',
    features: result.rows.map(r => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(r.longitude), parseFloat(r.latitude)],
      },
      properties: { accuracy: r.accuracy, pingedAt: r.pinged_at },
    })),
  };
};
