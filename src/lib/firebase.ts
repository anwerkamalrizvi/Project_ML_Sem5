// ─────────────────────────────────────────────────────────────────────────────
// Firebase Configuration (Safely Handled / Fallback Mode)
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isConfigured = Boolean(
  rawApiKey &&
  rawApiKey !== 'YOUR_FIREBASE_API_KEY_HERE' &&
  rawApiKey !== 'YOUR_FIREBASE_API_KEY' &&
  !rawApiKey.startsWith('YOUR_')
);

const firebaseConfig = {
  apiKey:            rawApiKey || 'mock-key',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'traveler-ai.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'traveler-ai',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'traveler-ai.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:123456789:web:abcdef',
};

// Only initialize if a genuine Firebase project key is provided
export const app = isConfigured
  ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
  : null;

export const auth = app ? getAuth(app) : ({} as any);
export const db   = app ? getFirestore(app) : ({} as any);
export const googleProvider = isConfigured ? new GoogleAuthProvider() : ({} as any);
if (googleProvider && typeof googleProvider.setCustomParameters === 'function') {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}
