import { z } from 'zod'

const schema = z.object({
  TWILIO_ACCOUNT_SID: z.string().trim().optional(),
  TWILIO_AUTH_TOKEN: z.string().trim().optional(),
  TWILIO_FROM: z.string().trim().optional(),

  SMS_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === 'true'),

  SMS_DRY_RUN: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),

  SMS_TIMEZONE: z.string().trim().default('Europe/London'),

  SMS_TEST_NUMBER: z.string().trim().optional(),

  SMS_MAX_PER_RUN: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number(v)
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 50
    }),
})

export type SmsConfig = z.infer<typeof schema>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): SmsConfig {
  return schema.parse(env)
}

export function twilioReady(c: SmsConfig): boolean {
  return Boolean(c.TWILIO_ACCOUNT_SID && c.TWILIO_AUTH_TOKEN && c.TWILIO_FROM)
}
