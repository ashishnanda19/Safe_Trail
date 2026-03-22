import { Worker } from 'bullmq';
import { bullmqRedis } from '../../config/redis.js';
import { sendSOSAlert } from '../../services/notification.service.js';
import { db } from '../../config/db.js';

/**
 * BullMQ Worker: processes 'send-alert' jobs from the alertQueue.
 * Sends Twilio SMS + FCM push notification to a single guardian.
 * Retries up to 3 times with exponential backoff on failure.
 */
export const startAlertWorker = () => {
  const worker = new Worker(
    'alerts',
    async (job) => {
      const {
        sosEventId,
        guardianId,
        guardianPhone,
        guardianFcmToken,
        userId,
        userName,
        location,
        nearestHospital,
        nearestPolice,
      } = job.data;

      // Create a pending log entry
      const logResult = await db.query(
        `INSERT INTO alerts_log (sos_event_id, recipient_id, channel, status)
         VALUES ($1, $2, 'sms', 'pending')
         RETURNING id`,
        [sosEventId, guardianId]
      );
      const logId = logResult.rows[0]?.id;

      try {
        await sendSOSAlert({
          guardianPhone,
          guardianFcmToken,
          userName: userName || 'A SafeTraiL user',
          location,
          sosEventId,
          nearestHospital,
          nearestPolice,
        });

        // Mark as sent
        if (logId) {
          await db.query(
            `UPDATE alerts_log
             SET status = 'sent', sent_at = NOW(), retry_count = $1
             WHERE id = $2`,
            [job.attemptsMade, logId]
          );
        }

        console.log(`✅ Alert sent: sosEvent=${sosEventId}, guardian=${guardianId}`);
      } catch (err) {
        // Update log with error
        if (logId) {
          await db.query(
            `UPDATE alerts_log
             SET status = 'failed', error_message = $1, retry_count = $2
             WHERE id = $3`,
            [err.message, job.attemptsMade, logId]
          );
        }
        throw err; // Re-throw so BullMQ retries
      }
    },
    {
      connection: bullmqRedis,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[AlertWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[AlertWorker] Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
  });

  console.log('🚀 Alert worker started (concurrency: 5)');
  return worker;
};
