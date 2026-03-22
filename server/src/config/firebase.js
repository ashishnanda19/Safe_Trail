import admin from 'firebase-admin';
import { env } from './env.js';

let firebaseApp = null;

const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_CLIENT_EMAIL) {
    console.warn('⚠️  Firebase credentials not configured — FCM push notifications disabled');
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('🔥 Firebase Admin SDK initialized');
    return firebaseApp;
  } catch (err) {
    console.error('❌ Firebase initialization failed:', err.message);
    return null;
  }
};

export const firebase = initFirebase();
export const messaging = firebaseApp ? admin.messaging() : null;
