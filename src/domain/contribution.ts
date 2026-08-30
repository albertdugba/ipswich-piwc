import { z } from 'zod'
import {
  contributionKindValues,
  paymentMethodValues,
  type ContributionKind,
  type PaymentMethod,
} from './enums'

export interface ContributionFund {
  id: string
  name: string
  kind: ContributionKind
  departmentId?: string | null
  beneficiaryPersonId?: string | null
  beneficiaryNote?: string | null
  expectedPerPerson?: number | null
  targetAmount?: number | null
  periodStart?: string | null
  periodEnd?: string | null
  isOpen: boolean
  notes?: string | null

  totalAmount: number
  contributorCount: number

  createdAt: number
  updatedAt: number
}

export interface ContributionRecord {
  id: string
  fundId: string
  personId: string
  amount: number
  contributedOn: string
  method: PaymentMethod
  note?: string | null
  recordedById?: string | null
  createdAt: number
}

export function isMinistryScoped(fund: {
  kind: ContributionKind
  departmentId?: string | null
}) {
  return fund.kind === 'MINISTRY_DUES' && Boolean(fund.departmentId)
}

export function tracksDues(fund: { expectedPerPerson?: number | null }) {
  return Boolean(fund.expectedPerPerson && fund.expectedPerPerson > 0)
}

export interface FundSummary {
  total: number
  paymentCount: number
  givenByPerson: Map<string, number>
  contributorCount: number
  rosterContributorCount: number
  rosterSize: number
  outstanding: number | null
  offRoster: { count: number; total: number; personIds: string[] }
}

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

export function progressPct(
  total: number,
  target?: number | null,
): number | null {
  if (!target || target <= 0) return null
  return Math.max(0, Math.min(Math.round((total / target) * 100), 100))
}

export function poundsToPence(pounds: string | number): number {
  const value = typeof pounds === 'string' ? Number(pounds) : pounds
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

export function penceToPounds(pence: number | null | undefined): number {
  return (pence ?? 0) / 100
}

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

const atMostTwoDecimals = (v: string) => /^\d+(\.\d{1,2})?$/.test(v)

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
