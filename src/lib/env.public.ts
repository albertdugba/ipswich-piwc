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

export const clientEnv = clientEnvSchema.parse(import.meta.env)

export const isFirebaseConfigured =
  Boolean(clientEnv.VITE_FIREBASE_API_KEY) &&
  Boolean(clientEnv.VITE_FIREBASE_PROJECT_ID) &&
  Boolean(clientEnv.VITE_FIREBASE_APP_ID)

export const useFirebaseEmulator =
  clientEnv.VITE_FIREBASE_USE_EMULATOR === 'true'
