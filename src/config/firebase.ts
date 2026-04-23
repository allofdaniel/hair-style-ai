import { getApps, getApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, type Auth } from 'firebase/auth';
import { logger } from '../services/logger';

const trimEnv = (value: string | undefined): string => (value || '').trim();

const firebaseConfig = {
  apiKey: trimEnv(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: trimEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: trimEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: trimEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: trimEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: trimEnv(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: trimEnv(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
};

const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
] as const;

export const isFirebaseConfigReady = requiredKeys.every((key) => Boolean(firebaseConfig[key]));

const getFirebaseApp = (): FirebaseApp | null => {
  if (!isFirebaseConfigReady) {
    if (!import.meta.env.PROD) {
      logger.warn('[Firebase] Environment config is incomplete. Authentication is disabled.');
    }
    return null;
  }

  if (getApps().length > 0) {
    return getApp();
  }

  try {
    return initializeApp(firebaseConfig);
  } catch (error) {
    logger.error('[Firebase] Failed to initialize app:', error);
    return null;
  }
};

export const app: FirebaseApp | null = getFirebaseApp();

export const auth: Auth | null = app ? getAuth(app) : null;

export const googleProvider = auth ? new GoogleAuthProvider() : null;
export const appleProvider = auth ? new OAuthProvider('apple.com') : null;

if (googleProvider) {
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
}

if (appleProvider) {
  appleProvider.addScope('email');
  appleProvider.addScope('name');
}

export default app;