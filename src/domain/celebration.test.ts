import { describe, expect, it } from 'vitest'
import {
  canSms,
  celebrationId,
  daysBetweenIso,
  isLeapYear,
  nextOccurrence,
  observedDate,
  parseIsoDate,
  planCelebrationMessages,
  receivesCelebrations,
  receivesMarriageAnniversary,
  upcomingCelebrations,
} from './celebration'
import type { Person } from './person'

function person(over: Partial<Person> = {}): Person {
  return {
    id: over.id ?? 'p1',
    firstName: 'Ama',
    lastName: 'Mensah',
    membershipStatus: 'MEMBER',
    isActive: true,
    createdAt: 0,
    updatedAt: 0,
    ...over,
  }
}

describe('parseIsoDate', () => {
  it('rejects anything that is not a real calendar date', () => {
    expect(parseIsoDate('2026-13-01')).toBeNull()
    expect(parseIsoDate('2026-02-30')).toBeNull()
    expect(parseIsoDate('2025-02-29')).toBeNull()
    expect(parseIsoDate('04/10/2026')).toBeNull()
    expect(parseIsoDate('')).toBeNull()
    expect(parseIsoDate(null)).toBeNull()
  })

  it('accepts 29 February in a leap year', () => {
    expect(parseIsoDate('2024-02-29')).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    })
  })
})

describe('isLeapYear', () => {
  it('applies the century rule', () => {
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(2025)).toBe(false)
    expect(isLeapYear(1900)).toBe(false)
    expect(isLeapYear(2000)).toBe(true)
  })
})

describe('daysBetweenIso', () => {
  it('counts whole days', () => {
    expect(daysBetweenIso('2026-10-01', '2026-10-03')).toBe(2)
    expect(daysBetweenIso('2026-10-03', '2026-10-01')).toBe(-2)
    expect(daysBetweenIso('2026-10-01', '2026-10-01')).toBe(0)
  })

  it('is unaffected by the British Summer Time transitions', () => {
    // Clocks go forward 30 Mar 2025 and back 26 Oct 2025. A naive
    // (end - start) / 86_400_000 on local Date objects gives 0.958 and 1.042
    // here, which floor/round to the wrong day.
    expect(daysBetweenIso('2025-03-29', '2025-03-31')).toBe(2)
    expect(daysBetweenIso('2025-10-25', '2025-10-27')).toBe(2)
  })

  it('spans month and year boundaries', () => {
    expect(daysBetweenIso('2026-12-31', '2027-01-01')).toBe(1)
    expect(daysBetweenIso('2026-02-28', '2026-03-01')).toBe(1)
    expect(daysBetweenIso('2024-02-28', '2024-03-01')).toBe(2)
  })
})

describe('observedDate', () => {
  it('keeps 29 February in a leap year', () => {
    expect(observedDate('2000-02-29', 2028)).toBe('2028-02-29')
  })

  it('moves 29 February to 1 March otherwise', () => {
    expect(observedDate('2000-02-29', 2027)).toBe('2027-03-01')
  })

  it('leaves every other date alone', () => {
    expect(observedDate('1990-07-14', 2026)).toBe('2026-07-14')
  })
})

describe('nextOccurrence', () => {
  it('returns today when the date is today', () => {
    const r = nextOccurrence('1990-07-14', '2026-07-14')
    expect(r).toMatchObject({ occursOn: '2026-07-14', daysUntil: 0, years: 36 })
  })

  it('rolls into next year once the date has passed', () => {
    const r = nextOccurrence('1990-07-14', '2026-07-15')
    expect(r).toMatchObject({ occursOn: '2027-07-14', daysUntil: 364 })
    expect(r?.years).toBe(37)
  })

  it('never returns a negative daysUntil', () => {
    for (const from of [
      '2026-01-01',
      '2026-07-13',
      '2026-07-14',
      '2026-12-31',
    ]) {
      expect(
        nextOccurrence('1990-07-14', from)!.daysUntil,
      ).toBeGreaterThanOrEqual(0)
    }
  })

  it('handles a 29 February birthday across leap and non-leap years', () => {
    expect(nextOccurrence('2000-02-29', '2027-02-27')).toMatchObject({
      occursOn: '2027-03-01',
      daysUntil: 2,
    })
    expect(nextOccurrence('2000-02-29', '2028-02-27')).toMatchObject({
      occursOn: '2028-02-29',
      daysUntil: 2,
    })
  })

  it('counts a New Year crossing correctly', () => {
    expect(nextOccurrence('1990-01-02', '2026-12-31')).toMatchObject({
      occursOn: '2027-01-02',
      daysUntil: 2,
    })
  })

  it('has no year count for a future source date', () => {
    expect(nextOccurrence('2030-05-05', '2026-05-05')?.years).toBeNull()
  })
})

describe('eligibility', () => {
  it('excludes deceased members from every celebration', () => {
    expect(receivesCelebrations(person({ membershipStatus: 'DECEASED' }))).toBe(
      false,
    )
    expect(receivesCelebrations(person({ isActive: false }))).toBe(false)
    expect(receivesCelebrations(person())).toBe(true)
  })

  it('only greets currently married people on their anniversary', () => {
    const base = { marriageDate: '2010-06-12' } as const
    expect(
      receivesMarriageAnniversary(
        person({ ...base, maritalStatus: 'MARRIED' }),
      ),
    ).toBe(true)
    // A widow still has a marriage date on record.
    expect(
      receivesMarriageAnniversary(
        person({ ...base, maritalStatus: 'WIDOWED' }),
      ),
    ).toBe(false)
    expect(
      receivesMarriageAnniversary(
        person({ ...base, maritalStatus: 'DIVORCED' }),
      ),
    ).toBe(false)
    expect(
      receivesMarriageAnniversary(person({ maritalStatus: 'MARRIED' })),
    ).toBe(false)
  })

  it('respects the SMS opt-out and requires a phone number', () => {
    expect(canSms(person({ phone: '07700900000' }))).toBe(true)
    expect(canSms(person({ phone: '07700900000', smsOptOut: true }))).toBe(
      false,
    )
    expect(canSms(person({ phone: '   ' }))).toBe(false)
    expect(canSms(person({}))).toBe(false)
    expect(
      canSms(person({ phone: '07700900000', membershipStatus: 'DECEASED' })),
    ).toBe(false)
  })
})

describe('upcomingCelebrations', () => {
  const from = '2026-07-13'

  it('includes today through the end of the window and nothing beyond', () => {
    const people = [
      person({ id: 'today', dateOfBirth: '1990-07-13' }),
      person({ id: 'edge', dateOfBirth: '1990-07-15' }),
      person({ id: 'outside', dateOfBirth: '1990-07-16' }),
    ]
    const ids = upcomingCelebrations(people, {
      fromIso: from,
      windowDays: 2,
    }).map((c) => c.person.id)
    expect(ids).toEqual(['today', 'edge'])
  })

  it('sorts soonest first', () => {
    const people = [
      person({ id: 'b', lastName: 'B', dateOfBirth: '1990-07-15' }),
      person({ id: 'a', lastName: 'A', dateOfBirth: '1990-07-13' }),
    ]
    expect(
      upcomingCelebrations(people, { fromIso: from, windowDays: 7 }).map(
        (c) => c.person.id,
      ),
    ).toEqual(['a', 'b'])
  })

  it('never surfaces a deceased member', () => {
    const people = [
      person({
        id: 'gone',
        dateOfBirth: '1990-07-13',
        marriageDate: '2010-07-13',
        maritalStatus: 'MARRIED',
        membershipDate: '2015-07-13',
        membershipStatus: 'DECEASED',
      }),
    ]
    expect(upcomingCelebrations(people, { fromIso: from })).toEqual([])
  })

  it('emits one entry per kind for the same person', () => {
    const people = [
      person({
        dateOfBirth: '1990-07-13',
        marriageDate: '2010-07-14',
        maritalStatus: 'MARRIED',
        membershipDate: '2015-07-15',
      }),
    ]
    const kinds = upcomingCelebrations(people, {
      fromIso: from,
      windowDays: 7,
    }).map((c) => c.kind)
    expect(kinds).toEqual([
      'BIRTHDAY',
      'MARRIAGE_ANNIVERSARY',
      'MEMBERSHIP_ANNIVERSARY',
    ])
  })

  it('can be narrowed to specific kinds', () => {
    const people = [
      person({
        dateOfBirth: '1990-07-13',
        marriageDate: '2010-07-13',
        maritalStatus: 'MARRIED',
      }),
    ]
    const result = upcomingCelebrations(people, {
      fromIso: from,
      windowDays: 7,
      kinds: ['BIRTHDAY'],
    })
    expect(result).toHaveLength(1)
    expect(result[0]!.kind).toBe('BIRTHDAY')
  })

  it('flags milestone years', () => {
    const people = [
      person({ id: 'm', dateOfBirth: '1976-07-13' }),
      person({ id: 'n', dateOfBirth: '1977-07-13' }),
    ]
    const byId = Object.fromEntries(
      upcomingCelebrations(people, { fromIso: from, windowDays: 1 }).map(
        (c) => [c.person.id, c],
      ),
    )
    expect(byId.m!.years).toBe(50)
    expect(byId.m!.isMilestone).toBe(true)
    expect(byId.n!.years).toBe(49)
    expect(byId.n!.isMilestone).toBe(false)
  })

  it('ignores unparseable dates instead of throwing', () => {
    const people = [person({ dateOfBirth: 'not-a-date' })]
    expect(upcomingCelebrations(people, { fromIso: from })).toEqual([])
  })

  it('wraps across the new year within the window', () => {
    const people = [person({ id: 'ny', dateOfBirth: '1990-01-01' })]
    const result = upcomingCelebrations(people, {
      fromIso: '2026-12-30',
      windowDays: 3,
    })
    expect(result).toHaveLength(1)
    expect(result[0]!.occursOn).toBe('2027-01-01')
    expect(result[0]!.daysUntil).toBe(2)
  })
})

describe('celebrationId', () => {
  it('is stable per person, kind and year so a greeting logs once', () => {
    const [c] = upcomingCelebrations(
      [person({ id: 'p9', dateOfBirth: '1990-07-13' })],
      { fromIso: '2026-07-13', windowDays: 0 },
    )
    expect(celebrationId(c!)).toBe('p9__BIRTHDAY__2026')
  })
})

describe('planCelebrationMessages', () => {
  const today = '2026-07-13'
  const opts = {
    todayIso: today,
    renderBody: (c: Parameters<typeof celebrationId>[0]) =>
      `hi ${c.person.firstName}`,
    normalisePhone: (raw: string | null | undefined) =>
      raw && raw.trim() ? `+44${raw.trim()}` : null,
  }

  it('only sends on the day itself, never in advance', () => {
    const people = [
      person({ id: 'today', dateOfBirth: '1990-07-13', phone: '1' }),
      person({ id: 'tomorrow', dateOfBirth: '1990-07-14', phone: '2' }),
    ]
    const plan = planCelebrationMessages({
      people,
      alreadyHandledIds: [],
      ...opts,
    })
    expect(plan.map((p) => p.celebration.person.id)).toEqual(['today'])
  })

  it('skips anyone already greeted, so a retry cannot double-send', () => {
    const people = [person({ id: 'p1', dateOfBirth: '1990-07-13', phone: '1' })]
    const first = planCelebrationMessages({
      people,
      alreadyHandledIds: [],
      ...opts,
    })
    expect(first).toHaveLength(1)

    const second = planCelebrationMessages({
      people,
      alreadyHandledIds: first.map((p) => p.id),
      ...opts,
    })
    expect(second).toEqual([])
  })

  it('never messages a deceased member', () => {
    const people = [
      person({
        id: 'gone',
        dateOfBirth: '1990-07-13',
        phone: '1',
        membershipStatus: 'DECEASED',
      }),
    ]
    expect(
      planCelebrationMessages({ people, alreadyHandledIds: [], ...opts }),
    ).toEqual([])
  })

  it('never messages someone who opted out', () => {
    const people = [
      person({ dateOfBirth: '1990-07-13', phone: '1', smsOptOut: true }),
    ]
    expect(
      planCelebrationMessages({ people, alreadyHandledIds: [], ...opts }),
    ).toEqual([])
  })

  it('never sends a wedding anniversary to a widow', () => {
    const people = [
      person({
        id: 'w',
        marriageDate: '2010-07-13',
        maritalStatus: 'WIDOWED',
        phone: '1',
      }),
    ]
    expect(
      planCelebrationMessages({ people, alreadyHandledIds: [], ...opts }),
    ).toEqual([])
  })

  it('excludes membership anniversaries from SMS by default', () => {
    const people = [
      person({ id: 'm', membershipDate: '2015-07-13', phone: '1' }),
    ]
    expect(
      planCelebrationMessages({ people, alreadyHandledIds: [], ...opts }),
    ).toEqual([])
  })

  it('drops anyone whose number cannot be dialled', () => {
    const people = [
      person({ id: 'nophone', dateOfBirth: '1990-07-13' }),
      person({ id: 'blank', dateOfBirth: '1990-07-13', phone: '   ' }),
    ]
    expect(
      planCelebrationMessages({ people, alreadyHandledIds: [], ...opts }),
    ).toEqual([])
  })

  it('produces one message per celebration with a dialable number and body', () => {
    const people = [
      person({
        id: 'both',
        firstName: 'Ama',
        dateOfBirth: '1990-07-13',
        marriageDate: '2010-07-13',
        maritalStatus: 'MARRIED',
        phone: '7700900123',
      }),
    ]
    const plan = planCelebrationMessages({
      people,
      alreadyHandledIds: [],
      ...opts,
    })
    expect(plan).toHaveLength(2)
    expect(plan[0]!.to).toBe('+447700900123')
    expect(plan[0]!.body).toBe('hi Ama')
    expect(new Set(plan.map((p) => p.id)).size).toBe(2)
  })
})
