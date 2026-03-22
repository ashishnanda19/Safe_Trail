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

jest.unstable_mockModule('../src/services/map.service.js', () => ({
  getNearestPlace: jest.fn().mockResolvedValue(null),
  findNearbyPlaces: jest.fn().mockResolvedValue([]),
  getRoute: jest.fn(),
  reverseGeocode: jest.fn(),
  getLivePings: jest.fn(),
}));

jest.unstable_mockModule('../src/config/firebase.js', () => ({
  firebase: null,
  messaging: null,
}));

const { default: request } = await import('supertest');
const { default: app } = await import('../src/app.js');
const { db: mockDb } = await import('../src/config/db.js');

const makeAccessToken = (role = 'user') =>
  jwt.sign(
    { id: 'user-uuid-1234', email: 'test@example.com', role, name: 'Test User' },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

const SAMPLE_INCIDENT = {
  id: 'inc-uuid-1234',
  category: 'harassment',
  description: 'Test incident',
  anonymous: false,
  occurred_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  reported_by: 'user-uuid-1234',
  longitude: -74.005974,
  latitude: 40.712776,
};

describe('POST /api/incidents', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 201 on valid incident creation', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [SAMPLE_INCIDENT] });

    const token = makeAccessToken();
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        latitude: 40.712776,
        longitude: -74.005974,
        category: 'harassment',
        description: 'Test incident description',
        anonymous: false,
        occurred_at: '2024-01-15T18:30:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.incident.category).toBe('harassment');
  });

  it('returns 422 for invalid category', async () => {
    const token = makeAccessToken();
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        latitude: 40.712776,
        longitude: -74.005974,
        category: 'invalid_category',
        occurred_at: '2024-01-15T18:30:00.000Z',
      });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('creates incident with reported_by null when anonymous=true', async () => {
    const anonymousIncident = { ...SAMPLE_INCIDENT, anonymous: true, reported_by: null };
    mockDb.query.mockResolvedValueOnce({ rows: [anonymousIncident] });

    const token = makeAccessToken();
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        latitude: 40.712776,
        longitude: -74.005974,
        category: 'stalking',
        anonymous: true,
        occurred_at: '2024-01-15T18:30:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.incident.reported_by).toBeNull();
    expect(res.body.data.incident.anonymous).toBe(true);
  });
});

describe('GET /api/incidents/nearby', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns array of nearby incidents', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{ ...SAMPLE_INCIDENT, distance_metres: 250 }],
    });

    const token = makeAccessToken();
    const res = await request(app)
      .get('/api/incidents/nearby?lat=40.712776&lng=-74.005974&radius=1000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.incidents)).toBe(true);
  });

  it('returns 422 when lat/lng missing', async () => {
    const token = makeAccessToken();
    const res = await request(app)
      .get('/api/incidents/nearby')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(422);
  });
});
