import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = 'test_access_secret_at_least_32_characters_long';
process.env.ACCESS_TOKEN_SECRET = ACCESS_TOKEN_SECRET;
process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret_at_least_32_characters_long';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';

jest.unstable_mockModule('../src/config/db.js', () => ({
  db: { query: jest.fn(), end: jest.fn() },
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.unstable_mockModule('../src/config/redis.js', () => ({
  redis: { get: jest.fn().mockResolvedValue(null), setex: jest.fn(), del: jest.fn() },
  bullmqRedis: { disconnect: jest.fn() },
}));

jest.unstable_mockModule('../src/jobs/queues.js', () => ({
  alertQueue: { add: jest.fn() },
  incidentQueue: { add: jest.fn() },
}));

jest.unstable_mockModule('../src/sockets/index.js', () => ({
  initSocketIO: jest.fn(),
  emitToRoom: jest.fn(),
  getIO: jest.fn(),
}));

jest.unstable_mockModule('../src/config/firebase.js', () => ({
  firebase: null,
  messaging: null,
}));

// Mock the map service to return predictable data
jest.unstable_mockModule('../src/services/map.service.js', () => ({
  findNearbyPlaces: jest.fn().mockResolvedValue([
    {
      id: '123',
      name: 'City Hospital',
      type: 'hospital',
      lat: 40.714,
      lng: -74.006,
      phone: '+1555000111',
      address: '123 Main St',
      openingHours: '24/7',
    },
  ]),
  getNearestPlace: jest.fn().mockResolvedValue({
    id: '123',
    name: 'Police Station 1st Precinct',
    type: 'police',
    lat: 40.714,
    lng: -74.006,
    distanceMetres: 320,
    distanceText: '320 m',
  }),
  getRoute: jest.fn().mockResolvedValue({
    distanceMetres: 1200,
    durationSeconds: 240,
    durationText: '4 mins',
    distanceText: '1.2 km',
    geometry: { type: 'LineString', coordinates: [[-74.006, 40.712], [-74.005, 40.714]] },
    steps: [],
  }),
  reverseGeocode: jest.fn().mockResolvedValue({
    displayName: 'Manhattan, New York, NY, USA',
    road: 'Broadway',
    city: 'New York',
    state: 'New York',
    postcode: '10001',
  }),
  getLivePings: jest.fn().mockResolvedValue({ type: 'FeatureCollection', features: [] }),
}));

const { default: request } = await import('supertest');
const { default: app } = await import('../src/app.js');

const makeToken = (role = 'user') =>
  jwt.sign(
    { id: 'user-uuid-1234', email: 'test@example.com', role, name: 'Test User' },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

describe('GET /api/map/nearby', () => {
  it('returns 200 with places array for valid params', async () => {
    const res = await request(app)
      .get('/api/map/nearby?lat=40.712776&lng=-74.005974&type=hospital&radius=3000')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.places)).toBe(true);
  });

  it('returns 422 for invalid amenity type', async () => {
    const res = await request(app)
      .get('/api/map/nearby?lat=40.712776&lng=-74.005974&type=nightclub')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .get('/api/map/nearby?lat=40.712776&lng=-74.005974&type=hospital');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/map/route', () => {
  it('returns 200 with route data for valid coords', async () => {
    const res = await request(app)
      .get('/api/map/route?originLat=40.712776&originLng=-74.005974&destLat=40.730610&destLng=-73.935242')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.route).toHaveProperty('distanceMetres');
    expect(res.body.data.route).toHaveProperty('durationText');
    expect(res.body.data.route.geometry.type).toBe('LineString');
  });
});

describe('GET /api/map/heatmap (admin only)', () => {
  it('returns 200 for admin user', async () => {
    const { db: mockDb } = await import('../src/config/db.js');
    mockDb.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/map/heatmap?minLat=40&maxLat=41&minLng=-75&maxLng=-73')
      .set('Authorization', `Bearer ${makeToken('admin')}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 403 for regular user', async () => {
    const res = await request(app)
      .get('/api/map/heatmap?minLat=40&maxLat=41&minLng=-75&maxLng=-73')
      .set('Authorization', `Bearer ${makeToken('user')}`);

    expect(res.status).toBe(403);
  });
});
