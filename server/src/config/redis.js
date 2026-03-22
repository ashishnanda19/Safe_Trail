import Redis from 'ioredis';
import { env } from './env.js';

const createRedisClient = () => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    lazyConnect: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  client.on('connect', () => {
    if (env.NODE_ENV !== 'test') {
      console.log('🔴 Redis client connected');
    }
  });

  client.on('error', (err) => {
    console.error('❌ Redis client error:', err.message);
  });

  return client;
};

// Main Redis client for caching / pub-sub
export const redis = createRedisClient();

// Separate Redis connection for BullMQ (requires maxRetriesPerRequest: null)
export const bullmqRedis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
