import { z } from 'zod'
import {
  contributionKindValues,
  paymentMethodValues,
  type ContributionKind,
  type PaymentMethod,
} from './enums'

/*
 * Internal contribution tracking — who gave what, to which collection. This is
 * deliberately NOT church accounting: there is no ledger, no reconciliation and
 * no double entry. It answers "has this member paid their dues?" and "how much
 * did we raise for Ama's bereavement?".
 *
 * MONEY IS STORED AS INTEGER PENCE, never pounds-as-float. `0.1 + 0.2 !== 0.3`
 * in binary floating point, and summing hundreds of contributions compounds the
 * drift into real, visible errors. Convert at the UI boundary only, with the
 * poundsToPence / penceToPounds helpers below.
 *
 * Firestore collections:
 *   contributionFunds     — one doc per collection/appeal/cycle
 *   contributionRecords   — one doc per payment (a person may pay in instalments,
 *                           so this is many-per-person-per-fund, auto-id)
 */

export interface ContributionFund {
  id: string
  name: string
  kind: ContributionKind
  /** MINISTRY_DUES only — restricts the roster to this department's members. */
  departmentId?: string | null
  /** BEREAVEMENT only — the member being supported. */
  beneficiaryPersonId?: string | null
  /** BEREAVEMENT only — free text, e.g. "mother, Grace Mensah". The deceased is
   *  normally not in the directory, so this avoids inventing Person records. */
  beneficiaryNote?: string | null
  /** Dues only — what each member is expected to pay, in pence. */
  expectedPerPerson?: number | null
  /** Optional fundraising goal, in pence. */
  targetAmount?: number | null
  /** ISO YYYY-MM-DD. Recurring funds use both; one-off appeals may use neither. */
  periodStart?: string | null
  periodEnd?: string | null
  /** Closed funds stay readable but reject new contributions. */
  isOpen: boolean
  notes?: string | null

  /** Denormalised so the list page doesn't need to read every record. */
  totalAmount: number
  contributorCount: number

  createdAt: number
  updatedAt: number
}

export interface ContributionRecord {
  id: string
  fundId: string
  personId: string
  /** Integer pence. */
  amount: number
  contributedOn: string // ISO YYYY-MM-DD
  method: PaymentMethod
  note?: string | null
  recordedById?: string | null
  createdAt: number
}

/** True when this kind of fund lists only one ministry's members. */
export function isMinistryScoped(fund: {
  kind: ContributionKind
  departmentId?: string | null
}) {
  return fund.kind === 'MINISTRY_DUES' && Boolean(fund.departmentId)
}

/** True when a per-person expectation makes "unpaid / part-paid" meaningful. */
export function tracksDues(fund: { expectedPerPerson?: number | null }) {
  return Boolean(fund.expectedPerPerson && fund.expectedPerPerson > 0)
}

/* ---- Aggregation ---------------------------------------------------------- */

export interface FundSummary {
  /** Every penny recorded against the fund, including off-roster givers. */
  total: number
  /** Number of individual payments (a person may have several). */
  paymentCount: number
  /** personId → total given, in pence. */
  givenByPerson: Map<string, number>
  /** Distinct people who gave anything at all. */
  contributorCount: number
  /** Distinct people who gave AND appear on the roster — the "x of y" numerator. */
  rosterContributorCount: number
  /** How many roster members are still expected to give. */
  rosterSize: number
  /** Pence still expected from roster members, or null when no per-person amount. */
  outstanding: number | null
  /**
   * Money from people who are not on the roster — someone who left the ministry
   * after paying, or whose Person record was deleted. It still counts towards
   * the total, so it must be surfaced rather than silently unattributed.
   */
  offRoster: { count: number; total: number; personIds: string[] }
}

/*
 * Single source of truth for every figure shown about a fund. Kept pure and out
 * of the route so it can be tested directly — this is money for a real church,
 * and an aggregation bug here is worse than a crash because nothing looks wrong.
 *
 * All arithmetic is on integer pence; division to pounds happens once, at
 * display time.
 */
export function summariseFund(
  fund: Pick<ContributionFund, 'expectedPerPerson'>,
  records: ContributionRecord[],
  eligiblePersonIds: Iterable<string>,
): FundSummary {
  const roster = new Set(eligiblePersonIds)

  const givenByPerson = new Map<string, number>()
  let total = 0
  for (const r of records) {
    total += r.amount
    givenByPerson.set(
      r.personId,
      (givenByPerson.get(r.personId) ?? 0) + r.amount,
    )
  }

  const offRosterIds = [...givenByPerson.keys()].filter((id) => !roster.has(id))
  const offRosterTotal = offRosterIds.reduce(
    (sum, id) => sum + (givenByPerson.get(id) ?? 0),
    0,
  )

  const expected = fund.expectedPerPerson ?? 0
  const outstanding =
    expected > 0
      ? [...roster].reduce(
          // Overpayment by one person must not cancel out another's shortfall,
          // hence the clamp at zero rather than a plain subtraction.
          (sum, id) =>
            sum + Math.max(expected - (givenByPerson.get(id) ?? 0), 0),
          0,
        )
      : null

  return {
    total,
    paymentCount: records.length,
    givenByPerson,
    contributorCount: givenByPerson.size,
    rosterContributorCount: [...roster].filter(
      (id) => (givenByPerson.get(id) ?? 0) > 0,
    ).length,
    rosterSize: roster.size,
    outstanding,
    offRoster: {
      count: offRosterIds.length,
      total: offRosterTotal,
      personIds: offRosterIds,
    },
  }
}

/** Percentage of a target reached, clamped to 0–100. Null when no target. */
export function progressPct(
  total: number,
  target?: number | null,
): number | null {
  if (!target || target <= 0) return null
  return Math.max(0, Math.min(Math.round((total / target) * 100), 100))
}

/* ---- Money helpers -------------------------------------------------------- */

/** "12.30" → 1230. Rounds to the nearest penny; NaN becomes 0. */
export function poundsToPence(pounds: string | number): number {
  const value = typeof pounds === 'string' ? Number(pounds) : pounds
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

/** 1230 → 12.3, for display through formatGBP. */
export function penceToPounds(pence: number | null | undefined): number {
  return (pence ?? 0) / 100
}

/* ---- Schemas -------------------------------------------------------------- */

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))

const optionalDate = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use a valid date')
  .transform((v) => (v ? v : undefined))

/*
 * Sub-penny amounts are rejected rather than rounded. `1.005 * 100` is
 * 100.49999… in binary floating point, so rounding it would silently drop a
 * penny — and no one can hand over half a penny anyway. Better to refuse the
 * input than to quietly change it.
 */
const atMostTwoDecimals = (v: string) => /^\d+(\.\d{1,2})?$/.test(v)

/** A money field typed in pounds, stored in pence. Empty means "not set". */
const optionalMoney = z
  .string()
  .trim()
  .optional()
  .refine(
    (v) => !v || (Number.isFinite(Number(v)) && Number(v) >= 0),
    'Enter a valid amount',
  )
  .refine((v) => !v || atMostTwoDecimals(v), 'Use at most 2 decimal places')
  .transform((v) => (v ? poundsToPence(v) : undefined))

export const contributionFundFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    kind: z.enum(contributionKindValues),
    departmentId: optionalString,
    beneficiaryPersonId: optionalString,
    beneficiaryNote: optionalString,
    expectedPerPerson: optionalMoney,
    targetAmount: optionalMoney,
    periodStart: optionalDate,
    periodEnd: optionalDate,
    isOpen: z.boolean(),
    notes: optionalString,
  })
  // Each kind has a field it cannot work without; enforce that here rather than
  // leaving the UI to remember.
  .refine((v) => v.kind !== 'MINISTRY_DUES' || Boolean(v.departmentId), {
    message: 'Choose which ministry these dues belong to',
    path: ['departmentId'],
  })
  .refine((v) => v.kind !== 'BEREAVEMENT' || Boolean(v.beneficiaryPersonId), {
    message: 'Choose the member being supported',
    path: ['beneficiaryPersonId'],
  })
  .refine(
    (v) => !v.periodStart || !v.periodEnd || v.periodEnd >= v.periodStart,
    {
      message: 'End date cannot be before the start date',
      path: ['periodEnd'],
    },
  )

export type ContributionFundFormValues = z.infer<
  typeof contributionFundFormSchema
>
export type ContributionFundFormInput = z.input<
  typeof contributionFundFormSchema
>

export const contributionRecordFormSchema = z.object({
  personId: z.string().trim().min(1, 'Choose who contributed'),
  amount: z
    .string()
    .trim()
    .min(1, 'Enter an amount')
    .refine((v) => Number.isFinite(Number(v)), 'Enter a valid amount')
    .refine((v) => Number(v) > 0, 'Amount must be more than zero')
    .refine(atMostTwoDecimals, 'Use at most 2 decimal places')
    .transform(poundsToPence),
  contributedOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date'),
  method: z.enum(paymentMethodValues),
  note: optionalString,
})

export type ContributionRecordFormValues = z.infer<
  typeof contributionRecordFormSchema
>
export type ContributionRecordFormInput = z.input<
  typeof contributionRecordFormSchema
>

/** Today as an ISO YYYY-MM-DD string (local time). */
export function todayIso(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const emptyFundForm = {
  name: '',
  kind: 'SPECIAL',
  isOpen: true,
} satisfies Partial<ContributionFundFormInput>
