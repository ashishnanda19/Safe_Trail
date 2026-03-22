/**
 * Auth route integration tests
 * Uses Supertest to test the Express app directly.
 * DB + Redis are mocked so no live infrastructure needed.
 */
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = 'test_access_secret_at_least_32_characters_long';
const REFRESH_TOKEN_SECRET = 'test_refresh_secret_at_least_32_characters_long';

// MUST be set before any src/ module is imported (env.js validates on load)
process.env.ACCESS_TOKEN_SECRET = ACCESS_TOKEN_SECRET;
process.env.REFRESH_TOKEN_SECRET = REFRESH_TOKEN_SECRET;
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NODE_ENV = 'test';

// Mock DB and Redis before importing app
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
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  },
  bullmqRedis: {
    get: jest.fn(),
    set: jest.fn(),
    disconnect: jest.fn(),
  },
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

jest.unstable_mockModule('../src/config/firebase.js', () => ({
  firebase: null,
  messaging: null,
}));

const { default: request } = await import('supertest');
const { default: app } = await import('../src/app.js');
const { db } = await import('../src/config/db.js');
const { db: mockDb } = await import('../src/config/db.js');

const VALID_USER = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  role: 'user',
  is_active: true,
  created_at: new Date().toISOString(),
};

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 201 with tokens on valid registration', async () => {
    // No existing user found
    mockDb.query
      .mockResolvedValueOnce({ rows: [] }) // findByEmail check
      .mockResolvedValueOnce({ rows: [VALID_USER] }) // createUser
      .mockResolvedValueOnce({ rows: [{ id: 'token-id' }] }); // createToken

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe('test@example.com');
  });

  it('returns 409 when email already exists', async () => {
    // Return existing user
    mockDb.query.mockResolvedValueOnce({ rows: [VALID_USER] });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password123',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 on invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'not-an-email', phone: '1234567890', password: 'password123' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 on wrong password', async () => {
    // Return user but bcrypt compare will fail (different hash)
    mockDb.query.mockResolvedValueOnce({
      rows: [{
        ...VALID_USER,
        // bcrypt hash of 'differentpassword'
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCMRasHz6YDg4D.ViXFl.wG',
      }],
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for non-existent user', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when no refresh token provided', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 401 for a structurally invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid.jwt.token' });

    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  it('returns 200 with health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
