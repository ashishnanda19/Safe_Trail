import Redis from 'ioredis';
import { env } from './env.js';

const getRedisOptions = () => ({
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  lazyConnect: false,
  // Automatically enable TLS if rediss:// is used or in production
  tls: (env.REDIS_URL.startsWith('rediss://') || env.NODE_ENV === 'production') ? {} : undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Main Redis client for caching / pub-sub
export const redis = new Redis(env.REDIS_URL, getRedisOptions());

// Separate Redis connection for BullMQ
export const bullmqRedis = new Redis(env.REDIS_URL, getRedisOptions());
