import { z } from 'zod';

export const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  type: z.enum(['hospital', 'police', 'pharmacy', 'fire_station', 'clinic']),
  radius: z.coerce.number().min(100).max(50000).default(3000),
});

export const nearestSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  type: z.enum(['hospital', 'police', 'pharmacy', 'fire_station', 'clinic']),
  radius: z.coerce.number().min(100).max(100000).default(50000),
});

export const routeSchema = z.object({
  originLat: z.coerce.number().min(-90).max(90),
  originLng: z.coerce.number().min(-180).max(180),
  destLat: z.coerce.number().min(-90).max(90),
  destLng: z.coerce.number().min(-180).max(180),
  profile: z.enum(['driving', 'walking', 'cycling']).default('driving'),
});

export const reverseGeocodeSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const heatmapSchema = z.object({
  minLat: z.coerce.number().min(-90).max(90),
  maxLat: z.coerce.number().min(-90).max(90),
  minLng: z.coerce.number().min(-180).max(180),
  maxLng: z.coerce.number().min(-180).max(180),
});
