import type { Person } from './person'

export const celebrationKindValues = [
  'BIRTHDAY',
  'MARRIAGE_ANNIVERSARY',
  'MEMBERSHIP_ANNIVERSARY',
] as const
export type CelebrationKind = (typeof celebrationKindValues)[number]

export const celebrationKindLabels: Record<CelebrationKind, string> = {
  BIRTHDAY: 'Birthday',
  MARRIAGE_ANNIVERSARY: 'Wedding anniversary',
  MEMBERSHIP_ANNIVERSARY: 'Membership anniversary',
}

export interface Celebration {
  person: Person
  kind: CelebrationKind
  /** The original ISO YYYY-MM-DD the celebration derives from. */
  sourceDate: string
  /** ISO YYYY-MM-DD this year's or next year's occurrence falls on. */
  occursOn: string
  /** 0 = today, 1 = tomorrow. Never negative. */
  daysUntil: number
  /** Age, or years married/in membership, on `occursOn`. Null if unknowable. */
  years: number | null
  /** A round number worth marking specially. */
  isMilestone: boolean
}

const MILESTONE_YEARS = new Set([
  1, 5, 10, 16, 18, 21, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100,
])

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseIsoDate(
  iso: string | null | undefined,
): { year: number; month: number; day: number } | null {
  if (!iso) return null
  const m = ISO_DATE.exec(iso.trim())
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  if (day > daysInMonth(year, month)) return null
  return { year, month, day }
}

export function toIsoDate(year: number, month: number, day: number): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${year}-${p(month)}-${p(day)}`
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31
}

/** Today in the church's timezone, as ISO YYYY-MM-DD. */
export function todayIso(timeZone = 'Europe/London', now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return parts
}

/** Whole days between two ISO dates, ignoring clocks and DST entirely. */
export function daysBetweenIso(fromIso: string, toIso: string): number {
  const a = parseIsoDate(fromIso)
  const b = parseIsoDate(toIso)
  if (!a || !b) return 0
  const utcA = Date.UTC(a.year, a.month - 1, a.day)
  const utcB = Date.UTC(b.year, b.month - 1, b.day)
  return Math.round((utcB - utcA) / 86_400_000)
}

/**
 * The date an anniversary of `sourceIso` is observed in `year`.
 * 29 February is observed on 1 March in non-leap years.
 */
export function observedDate(sourceIso: string, year: number): string | null {
  const src = parseIsoDate(sourceIso)
  if (!src) return null
  if (src.month === 2 && src.day === 29 && !isLeapYear(year)) {
    return toIsoDate(year, 3, 1)
  }
  return toIsoDate(year, src.month, src.day)
}

/**
 * The next occurrence of `sourceIso` on or after `fromIso`, with how many days
 * away it is and how many years it will mark.
 */
export function nextOccurrence(
  sourceIso: string,
  fromIso: string,
): { occursOn: string; daysUntil: number; years: number | null } | null {
  const src = parseIsoDate(sourceIso)
  const from = parseIsoDate(fromIso)
  if (!src || !from) return null

  let occursOn = observedDate(sourceIso, from.year)
  if (!occursOn) return null
  if (daysBetweenIso(fromIso, occursOn) < 0) {
    occursOn = observedDate(sourceIso, from.year + 1)
    if (!occursOn) return null
  }

  const occurrence = parseIsoDate(occursOn)
  if (!occurrence) return null

  const years = occurrence.year - src.year
  return {
    occursOn,
    daysUntil: daysBetweenIso(fromIso, occursOn),
    years: years > 0 ? years : null,
  }
}

/**
 * A person is excluded from every celebration reminder when they have died, or
 * when their record has been deactivated. Texting a deceased member on their
 * birthday is the worst failure this feature can have, so it is gated on an
 * explicit status rather than inferred.
 */
export function receivesCelebrations(person: Person): boolean {
  return person.membershipStatus !== 'DECEASED' && person.isActive
}

/**
 * Wedding anniversaries are only for people currently married. WIDOWED and
 * DIVORCED members keep their `marriageDate` on record, and greeting them on it
 * would be cruel.
 */
export function receivesMarriageAnniversary(person: Person): boolean {
  return (
    receivesCelebrations(person) &&
    person.maritalStatus === 'MARRIED' &&
    Boolean(person.marriageDate)
  )
}

/** True when the church may send this person an automated SMS. */
export function canSms(person: Person): boolean {
  return (
    receivesCelebrations(person) &&
    !person.smsOptOut &&
    Boolean(person.phone?.trim())
  )
}

function build(
  person: Person,
  kind: CelebrationKind,
  sourceDate: string,
  fromIso: string,
): Celebration | null {
  const next = nextOccurrence(sourceDate, fromIso)
  if (!next) return null
  return {
    person,
    kind,
    sourceDate,
    occursOn: next.occursOn,
    daysUntil: next.daysUntil,
    years: next.years,
    isMilestone: next.years !== null && MILESTONE_YEARS.has(next.years),
  }
}

/**
 * Every celebration falling within `windowDays` of `fromIso`, soonest first.
 * `windowDays` of 2 yields today, tomorrow and the day after.
 */
export function upcomingCelebrations(
  people: Person[],
  {
    fromIso,
    windowDays = 7,
    kinds = celebrationKindValues,
  }: {
    fromIso: string
    windowDays?: number
    kinds?: readonly CelebrationKind[]
  },
): Celebration[] {
  const wanted = new Set(kinds)
  const out: Celebration[] = []

  for (const person of people) {
    if (!receivesCelebrations(person)) continue

    if (wanted.has('BIRTHDAY') && person.dateOfBirth) {
      const c = build(person, 'BIRTHDAY', person.dateOfBirth, fromIso)
      if (c) out.push(c)
    }
    if (
      wanted.has('MARRIAGE_ANNIVERSARY') &&
      receivesMarriageAnniversary(person)
    ) {
      const c = build(
        person,
        'MARRIAGE_ANNIVERSARY',
        person.marriageDate as string,
        fromIso,
      )
      if (c) out.push(c)
    }
    if (wanted.has('MEMBERSHIP_ANNIVERSARY') && person.membershipDate) {
      const c = build(
        person,
        'MEMBERSHIP_ANNIVERSARY',
        person.membershipDate,
        fromIso,
      )
      if (c) out.push(c)
    }
  }

  return out
    .filter((c) => c.daysUntil <= windowDays)
    .sort(
      (a, b) =>
        a.daysUntil - b.daysUntil ||
        a.person.lastName.localeCompare(b.person.lastName),
    )
}

export function relativeDayLabel(daysUntil: number): string {
  if (daysUntil === 0) return 'Today'
  if (daysUntil === 1) return 'Tomorrow'
  return `In ${daysUntil} days`
}

/** Stable id for "this person's Nth birthday", so a greeting is logged once. */
export function celebrationId(c: Celebration): string {
  return `${c.person.id}__${c.kind}__${c.occursOn.slice(0, 4)}`
}
