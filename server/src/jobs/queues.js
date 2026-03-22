import { Queue } from 'bullmq';
import { bullmqRedis } from '../config/redis.js';

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

/**
 * alertQueue — processes Twilio SMS + FCM push notifications per guardian
 */
export const alertQueue = new Queue('alerts', {
  connection: bullmqRedis,
  defaultJobOptions,
});

/**
 * incidentQueue — async incident DB writes (offload from request cycle)
 */
export const incidentQueue = new Queue('incidents', {
  connection: bullmqRedis,
  defaultJobOptions,
});

export const queues = { alertQueue, incidentQueue };
