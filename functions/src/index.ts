import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'

import {
  celebrationKindLabels,
  planCelebrationMessages,
  todayIso,
  type Celebration,
  type PlannedMessage,
} from '../../src/domain/celebration.js'
import type { Person } from '../../src/domain/person.js'
import { loadConfig, twilioReady } from './config.js'
import { sendSms } from './sms.js'

initializeApp()
const db = getFirestore()

const PEOPLE = 'people'
const GREETINGS = 'celebrationGreetings'
const DELIVERIES = 'smsDeliveries'

const CHURCH = 'Ipswich PIWC'

function greetingBody(c: Celebration): string {
  const name = c.person.preferredName?.trim() || c.person.firstName
  if (c.kind === 'MARRIAGE_ANNIVERSARY') {
    return c.years
      ? `Happy ${c.years}th wedding anniversary, ${name}! ${CHURCH} thanks God for your marriage and prays for many more years together.`
      : `Happy wedding anniversary, ${name}! ${CHURCH} thanks God for your marriage.`
  }
  return c.isMilestone && c.years
    ? `Happy ${c.years}th birthday, ${name}! What a milestone. The whole ${CHURCH} family is celebrating with you today and praying God's richest blessing over this new year.`
    : `Happy birthday, ${name}! The ${CHURCH} family is celebrating with you today. May the Lord bless you and keep you.`
}

function normalisePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const plus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null
  if (plus) return `+${digits}`
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  if (digits.startsWith('0')) return `+44${digits.slice(1)}`
  if (digits.startsWith('44')) return `+${digits}`
  return `+${digits}`
}

async function readPeople(): Promise<Person[]> {
  const snap = await db.collection(PEOPLE).get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Person)
}

async function readHandledIds(today: string): Promise<string[]> {
  const snap = await db
    .collection(GREETINGS)
    .where('occursOn', '==', today)
    .get()
  return snap.docs.map((d) => d.id)
}

/**
 * Reserve the right to message this person today. `create` fails if the doc
 * already exists, which is what makes a retried or overlapping run unable to
 * send twice. It also means a leader who ticked "greeted" in the app suppresses
 * the automated message, so nobody is contacted about the same thing twice.
 */
async function claim(msg: PlannedMessage): Promise<boolean> {
  try {
    await db.collection(GREETINGS).doc(msg.id).create({
      personId: msg.celebration.person.id,
      kind: msg.celebration.kind,
      occursOn: msg.celebration.occursOn,
      greetedAt: Date.now(),
      greetedById: null,
      channel: 'SMS',
    })
    return true
  } catch {
    return false
  }
}

async function releaseClaim(id: string): Promise<void> {
  await db.collection(GREETINGS).doc(id).delete()
}

async function recordDelivery(
  msg: PlannedMessage,
  outcome: { status: string; providerId?: string; error?: string },
): Promise<void> {
  await db
    .collection(DELIVERIES)
    .doc(msg.id)
    .set({
      personId: msg.celebration.person.id,
      kind: msg.celebration.kind,
      occursOn: msg.celebration.occursOn,
      to: msg.to,
      body: msg.body,
      status: outcome.status,
      providerId: outcome.providerId ?? null,
      error: outcome.error ?? null,
      attemptedAt: Timestamp.now(),
    })
}

export interface RunSummary {
  today: string
  planned: number
  sent: number
  skipped: number
  failed: number
  enabled: boolean
  dryRun: boolean
}

async function runOnce(): Promise<RunSummary> {
  const config = loadConfig()
  const today = todayIso(config.SMS_TIMEZONE)

  const [people, handled] = await Promise.all([
    readPeople(),
    readHandledIds(today),
  ])

  const planned = planCelebrationMessages({
    people,
    todayIso: today,
    alreadyHandledIds: handled,
    renderBody: greetingBody,
    normalisePhone,
  })

  const summary: RunSummary = {
    today,
    planned: planned.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    enabled: config.SMS_ENABLED && twilioReady(config),
    dryRun: config.SMS_DRY_RUN,
  }

  // A hard cap means a bad import or a clock problem cannot text the whole
  // congregation before anyone notices.
  const batch = planned.slice(0, config.SMS_MAX_PER_RUN)
  if (planned.length > batch.length) {
    logger.warn('capped sms run', {
      planned: planned.length,
      cap: config.SMS_MAX_PER_RUN,
    })
  }

  for (const msg of batch) {
    if (!(await claim(msg))) {
      summary.skipped += 1
      continue
    }

    const outcome = await sendSms(config, msg.to, msg.body)

    if (outcome.status === 'SENT') {
      summary.sent += 1
      await recordDelivery(msg, outcome)
      continue
    }

    if (outcome.status === 'SKIPPED') {
      summary.skipped += 1
      // Nothing was sent, so the claim must not stand — otherwise the app would
      // show this person as greeted when they were never contacted.
      await releaseClaim(msg.id)
      await recordDelivery(msg, { status: 'SKIPPED', error: outcome.reason })
      continue
    }

    summary.failed += 1
    await recordDelivery(msg, { status: 'FAILED', error: outcome.error })
    if (outcome.permanent) {
      // A 4xx will fail identically forever; hand it back so a leader sees an
      // ungreeted row and can text manually.
      await releaseClaim(msg.id)
    }
    logger.error('sms failed', {
      id: msg.id,
      kind: celebrationKindLabels[msg.celebration.kind],
      permanent: outcome.permanent,
      error: outcome.error,
    })
  }

  logger.info('celebration sms run', summary)
  return summary
}

export const sendCelebrationMessages = onSchedule(
  {
    schedule: '0 9 * * *',
    timeZone: 'Europe/London',
    region: 'europe-west2',
    retryCount: 0,
    secrets: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM'],
  },
  async () => {
    await runOnce()
  },
)

export const previewCelebrationMessages = onCall(
  { region: 'europe-west2' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in first.')
    }
    const config = loadConfig()
    const today = todayIso(config.SMS_TIMEZONE)
    const [people, handled] = await Promise.all([
      readPeople(),
      readHandledIds(today),
    ])
    const planned = planCelebrationMessages({
      people,
      todayIso: today,
      alreadyHandledIds: handled,
      renderBody: greetingBody,
      normalisePhone,
    })
    return {
      today,
      enabled: config.SMS_ENABLED && twilioReady(config),
      dryRun: config.SMS_DRY_RUN,
      messages: planned.map((m) => ({
        id: m.id,
        name: `${m.celebration.person.firstName} ${m.celebration.person.lastName}`,
        kind: m.celebration.kind,
        to: m.to,
        body: m.body,
      })),
    }
  },
)
