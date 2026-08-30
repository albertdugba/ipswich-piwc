import { z } from 'zod'

const serverEnvSchema = z.object({
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
