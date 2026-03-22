import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = 'test_access_secret_at_least_32_characters_long';
const REFRESH_TOKEN_SECRET = 'test_refresh_secret_at_least_32_characters_long';

process.env.ACCESS_TOKEN_SECRET = ACCESS_TOKEN_SECRET;
process.env.REFRESH_TOKEN_SECRET = REFRESH_TOKEN_SECRET;
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';

jest.unstable_mockModule('../src/config/db.js', () => ({
  db: {
    query: jest.fn(),
    end: jest.fn(),
  },
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.unstable_mockModule('../src/config/redis.js', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn(),
  },
  bullmqRedis: { disconnect: jest.fn() },
}));

jest.unstable_mockModule('../src/jobs/queues.js', () => ({
  alertQueue: { add: jest.fn().mockResolvedValue({ id: 'job-1' }) },
  incidentQueue: { add: jest.fn().mockResolvedValue({ id: 'job-2' }) },
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

const SOS_EVENT = {
  id: 'sos-event-uuid-1234',
  user_id: 'user-uuid-1234',
  status: 'active',
  triggered_at: new Date().toISOString(),
  notes: null,
};

const makeAccessToken = (role = 'user') =>
  jwt.sign(
    { id: 'user-uuid-1234', email: 'test@example.com', role, name: 'Test User' },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

describe('POST /api/sos/trigger', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 201 with sosEventId when authenticated', async () => {
    // triggerSOS: insert sos_event + fetch guardians
    mockDb.query
      .mockResolvedValueOnce({ rows: [SOS_EVENT] })  // INSERT sos_events
      .mockResolvedValueOnce({ rows: [] });           // fetch guardians (empty)

    const token = makeAccessToken();
    const res = await request(app)
      .post('/api/sos/trigger')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: 40.712776, longitude: -74.005974 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('sosEventId');
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/sos/trigger')
      .send({ latitude: 40.712776, longitude: -74.005974 });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for invalid coordinates', async () => {
    const token = makeAccessToken();
    const res = await request(app)
      .post('/api/sos/trigger')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: 999, longitude: -74.005974 }); // lat out of range

    expect(res.status).toBe(422);
  });
});

describe('PATCH /api/sos/:eventId/resolve', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 and resolved status when event belongs to user', async () => {
    const resolvedEvent = { ...SOS_EVENT, status: 'resolved', resolved_at: new Date().toISOString() };
    mockDb.query.mockResolvedValueOnce({ rows: [resolvedEvent] });

    const token = makeAccessToken();
    const res = await request(app)
      .patch(`/api/sos/${SOS_EVENT.id}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.event.status).toBe('resolved');
  });

  it('returns 404 when event not found or already resolved', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] }); // no match

    const token = makeAccessToken();
    const res = await request(app)
      .patch('/api/sos/nonexistent-id/resolve')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(404);
  });
});

describe('GET /api/sos/history', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated array of SOS events', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [SOS_EVENT] })  // events
      .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // count

    const token = makeAccessToken();
    const res = await request(app)
      .get('/api/sos/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(1);
  });
});
