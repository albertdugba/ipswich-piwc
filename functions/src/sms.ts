import twilio from 'twilio'
import { logger } from 'firebase-functions'
import { twilioReady, type SmsConfig } from './config.js'

export type SendOutcome =
  | { status: 'SENT'; providerId: string }
  | { status: 'SKIPPED'; reason: string }
  | { status: 'FAILED'; error: string; permanent: boolean }

let client: ReturnType<typeof twilio> | null = null

function getClient(config: SmsConfig) {
  if (!client) {
    client = twilio(config.TWILIO_ACCOUNT_SID!, config.TWILIO_AUTH_TOKEN!)
  }
  return client
}

/**
 * Twilio surfaces unusable-recipient problems as 4xx. Those will fail again on
 * every retry, so they must not hold the claim open; anything else (network,
 * 5xx, timeout) might have reached the carrier and is treated as unsafe to
 * retry automatically.
 */
function isPermanent(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status
  return typeof status === 'number' && status >= 400 && status < 500
}

export async function sendSms(
  config: SmsConfig,
  to: string,
  body: string,
): Promise<SendOutcome> {
  if (!config.SMS_ENABLED) {
    return { status: 'SKIPPED', reason: 'SMS_ENABLED is not true' }
  }
  if (!twilioReady(config)) {
    return {
      status: 'SKIPPED',
      reason: 'Twilio credentials are not configured',
    }
  }

  const recipient = config.SMS_TEST_NUMBER || to

  if (config.SMS_DRY_RUN) {
    logger.info('dry-run sms', { to: recipient, chars: body.length })
    return { status: 'SKIPPED', reason: 'SMS_DRY_RUN is on' }
  }

  try {
    const message = await getClient(config).messages.create({
      to: recipient,
      from: config.TWILIO_FROM!,
      body,
    })
    return { status: 'SENT', providerId: message.sid }
  } catch (err) {
    return {
      status: 'FAILED',
      error: err instanceof Error ? err.message : String(err),
      permanent: isPermanent(err),
    }
  }
}
