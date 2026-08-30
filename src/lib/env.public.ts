import { z } from 'zod'

/*
 * Public environment (VITE_ prefixed, embedded in the browser bundle). Safe to
 * read on both server and client — these are Firebase Web config values, which
 * are public by design. NOTE: not named *.client.* on purpose, so TanStack
 * Start's import-protection allows SSR code to read it too. Parsed leniently:
 * all optional so the app still boots before a Firebase project is configured
 * (auth is scaffolded with a mock session in this phase).
 */
const clientEnvSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_FIREBASE_VAPID_KEY: z.string().optional(),
  // Set to "true" to route Firestore/Auth to the local Firebase emulators.
  VITE_FIREBASE_USE_EMULATOR: z.string().optional(),
})

export const clientEnv = clientEnvSchema.parse(import.meta.env)

/** True only when the minimum Firebase web config is present. */
export const isFirebaseConfigured =
  Boolean(clientEnv.VITE_FIREBASE_API_KEY) &&
  Boolean(clientEnv.VITE_FIREBASE_PROJECT_ID) &&
  Boolean(clientEnv.VITE_FIREBASE_APP_ID)

/** Whether to connect to the local Firebase emulators (dev only). */
export const useFirebaseEmulator =
  clientEnv.VITE_FIREBASE_USE_EMULATOR === 'true'
