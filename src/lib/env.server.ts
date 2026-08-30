import { z } from 'zod'

/*
 * Server-only environment validation (Rule 8: Zod at boundaries). Importing
 * this module from client code is a mistake — it reads secrets. The schema
 * fails fast with a readable message if required vars are missing.
 *
 * The app's data layer is Cloud Firestore accessed from the client, so there
 * is no database URL here. These vars are only the Firebase Admin credentials
 * used for verifying auth tokens when real auth is wired (session is mocked
 * for now).
 */
const serverEnvSchema = z.object({
  // Firebase Admin service account JSON (single-line string). Optional while
  // auth is scaffolded with a mock session; required once real auth is wired.
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
})

const parsed = serverEnvSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n')
  throw new Error(
    `Invalid server environment variables:\n${issues}\n` +
      'Copy .env.example to .env and fill in the required values.',
  )
}

export const serverEnv = parsed.data
