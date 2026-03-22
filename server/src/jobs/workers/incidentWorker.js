import { Worker } from 'bullmq';
import { bullmqRedis } from '../../config/redis.js';
import { db } from '../../config/db.js';

/**
 * BullMQ Worker: processes 'create-incident' jobs from the incidentQueue.
 * Offloads heavy incident writes from the request cycle.
 */
export const startIncidentWorker = () => {
  const worker = new Worker(
    'incidents',
    async (job) => {
      const { reportedBy, latitude, longitude, category, description, anonymous, occurredAt } = job.data;
      const location = `SRID=4326;POINT(${longitude} ${latitude})`;

      await db.query(
        `INSERT INTO incidents (reported_by, location, category, description, anonymous, occurred_at)
         VALUES ($1, ST_GeomFromEWKT($2), $3, $4, $5, $6)`,
        [anonymous ? null : reportedBy, location, category, description, anonymous, occurredAt]
      );

      console.log(`[IncidentWorker] Incident created: category=${category}`);
    },
    {
      connection: bullmqRedis,
      concurrency: 3,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[IncidentWorker] Job ${job?.id} failed:`, err.message);
  });

  console.log('🚀 Incident worker started (concurrency: 3)');
  return worker;
};
