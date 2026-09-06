import { z } from 'zod'

const clientEnvSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_FIREBASE_VAPID_KEY: z.string().optional(),
  VITE_FIREBASE_USE_EMULATOR: z.string().optional(),
})

const parsedClientEnv = clientEnvSchema.parse(import.meta.env)

// ---------------------------------------------------------------------------
// TEMPORARY — DEMO ONLY. Hardcoded Firebase *web* config so the deployed build
// works before the Vercel VITE_FIREBASE_* env vars are wired up. These are
// public client identifiers (they ship in the browser bundle regardless);
// data is protected by Firestore Security Rules, not by hiding these values.
// Env vars still take precedence, so this is inert once they're set on Vercel.
// REMOVE this block once the env vars are confirmed working.
// ---------------------------------------------------------------------------
const DEMO_FIREBASE = {
  VITE_FIREBASE_API_KEY: 'AIzaSyBQgQxjSZ_9JOzy7mWuwrSbLegFVkeByeU',
  VITE_FIREBASE_AUTH_DOMAIN: 'ipswich-piwc.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'ipswich-piwc',
  VITE_FIREBASE_STORAGE_BUCKET: 'ipswich-piwc.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '153066030201',
  VITE_FIREBASE_APP_ID: '153066030201',
} as const

export const clientEnv = {
  ...parsedClientEnv,
  VITE_FIREBASE_API_KEY:
    parsedClientEnv.VITE_FIREBASE_API_KEY || DEMO_FIREBASE.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN:
    parsedClientEnv.VITE_FIREBASE_AUTH_DOMAIN ||
    DEMO_FIREBASE.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID:
    parsedClientEnv.VITE_FIREBASE_PROJECT_ID ||
    DEMO_FIREBASE.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET:
    parsedClientEnv.VITE_FIREBASE_STORAGE_BUCKET ||
    DEMO_FIREBASE.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID:
    parsedClientEnv.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    DEMO_FIREBASE.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID:
    parsedClientEnv.VITE_FIREBASE_APP_ID || DEMO_FIREBASE.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured =
  Boolean(clientEnv.VITE_FIREBASE_API_KEY) &&
  Boolean(clientEnv.VITE_FIREBASE_PROJECT_ID) &&
  Boolean(clientEnv.VITE_FIREBASE_APP_ID)

export const useFirebaseEmulator =
  clientEnv.VITE_FIREBASE_USE_EMULATOR === 'true'
