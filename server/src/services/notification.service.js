import twilio from 'twilio';
import { messaging } from '../config/firebase.js';
import { env } from '../config/env.js';

// Lazy-initialize Twilio client (only if credentials are provided)
let twilioClient = null;
const getTwilioClient = () => {
  if (twilioClient) return twilioClient;
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    console.warn('⚠️  Twilio credentials not configured — SMS notifications disabled');
    return null;
  }
  twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  return twilioClient;
};

/**
 * Send an SMS to a phone number via Twilio
 */
export const sendSMS = async (to, body) => {
  const client = getTwilioClient();
  if (!client) {
    console.log(`[SMS MOCK] To: ${to} | Body: ${body}`);
    return;
  }

  return client.messages.create({
    body,
    from: env.TWILIO_PHONE_NUMBER,
    to,
  });
};

/**
 * Send a Firebase Cloud Messaging push notification
 */
export const sendPushNotification = async (fcmToken, { title, body, data = {} }) => {
  if (!messaging) {
    console.log(`[FCM MOCK] Token: ${fcmToken} | Title: ${title} | Body: ${body}`);
    return;
  }

  return messaging.send({
    token: fcmToken,
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    android: {
      priority: 'high',
      notification: { sound: 'default', channelId: 'sos_alerts' },
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  });
};

/**
 * Send the full SOS alert (SMS + FCM) to a single guardian
 */
export const sendSOSAlert = async ({ guardianPhone, guardianFcmToken, userName, location, sosEventId, nearestHospital, nearestPolice }) => {
  const { latitude, longitude } = location;

  const smsLines = [
    `🚨 EMERGENCY ALERT: ${userName} has triggered SOS!`,
    `📍 Live location: https://maps.google.com/?q=${latitude},${longitude}`,
    nearestHospital ? `🏥 Nearest hospital: ${nearestHospital.name} (${nearestHospital.distanceText})` : null,
    nearestPolice ? `👮 Nearest police: ${nearestPolice.name} (${nearestPolice.distanceText})` : null,
    `🔴 Track live: https://guardian-circle.app/sos/${sosEventId}`,
  ].filter(Boolean).join('\n');

  const results = await Promise.allSettled([
    sendSMS(guardianPhone, smsLines),
    guardianFcmToken
      ? sendPushNotification(guardianFcmToken, {
          title: `🚨 SOS Alert — ${userName} needs help!`,
          body: `Live location: https://maps.google.com/?q=${latitude},${longitude}`,
          data: { sosEventId, latitude: String(latitude), longitude: String(longitude), type: 'sos_alert' },
        })
      : Promise.resolve(),
  ]);

  const errors = results.filter(r => r.status === 'rejected').map(r => r.reason?.message);
  if (errors.length === results.length) {
    throw new Error(`All notification channels failed: ${errors.join('; ')}`);
  }

  return { smsResult: results[0], fcmResult: results[1] };
};
