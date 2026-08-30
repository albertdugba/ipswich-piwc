import { describe, expect, it } from 'vitest'
import {
  contributionFundFormSchema,
  contributionRecordFormSchema,
  penceToPounds,
  poundsToPence,
  progressPct,
  summariseFund,
  tracksDues,
  type ContributionRecord,
} from './contribution'

/*
 * Money is the highest-risk part of this module: a rounding slip here shows up
 * as a wrong total on someone's dues. These pin the pounds↔pence boundary and
 * the per-kind required fields.
 */

describe('poundsToPence', () => {
  it('converts whole and fractional pounds', () => {
    expect(poundsToPence('10')).toBe(1000)
    expect(poundsToPence('12.30')).toBe(1230)
    expect(poundsToPence(0.07)).toBe(7)
  })

  /*
   * Sub-penny input can't round reliably (1.005 * 100 is 100.49999… in float),
   * so the schemas reject it outright — see below. This documents that
   * poundsToPence itself is only trusted for 2dp input.
   */
  it('is exact for two decimal places', () => {
    expect(poundsToPence('1.00')).toBe(100)
    expect(poundsToPence('1.01')).toBe(101)
    expect(poundsToPence('0.99')).toBe(99)
  })

  it('survives float representation error', () => {
    // 19.99 * 100 is 1998.9999... in binary floating point.
    expect(poundsToPence('19.99')).toBe(1999)
    expect(poundsToPence('35.35')).toBe(3535)
  })

  it('treats unparseable input as zero rather than NaN', () => {
    expect(poundsToPence('abc')).toBe(0)
  })
})

describe('penceToPounds', () => {
  it('round-trips through poundsToPence', () => {
    for (const v of ['0.01', '5', '12.30', '19.99', '1234.56']) {
      expect(penceToPounds(poundsToPence(v))).toBeCloseTo(Number(v), 10)
    }
  })

  it('treats null as zero', () => {
    expect(penceToPounds(null)).toBe(0)
  })
})

describe('tracksDues', () => {
  it('is true only when a positive expectation is set', () => {
    expect(tracksDues({ expectedPerPerson: 500 })).toBe(true)
    expect(tracksDues({ expectedPerPerson: 0 })).toBe(false)
    expect(tracksDues({ expectedPerPerson: null })).toBe(false)
    expect(tracksDues({})).toBe(false)
  })
})

describe('contributionFundFormSchema', () => {
  const base = { name: 'October dues', isOpen: true }

  it('stores typed pounds as integer pence', () => {
    const result = contributionFundFormSchema.parse({
      ...base,
      kind: 'MONTHLY_DUES',
      expectedPerPerson: '12.50',
      targetAmount: '1000',
    })
    expect(result.expectedPerPerson).toBe(1250)
    expect(result.targetAmount).toBe(100000)
  })

  it('requires a ministry for ministry dues', () => {
    const bad = contributionFundFormSchema.safeParse({
      ...base,
      kind: 'MINISTRY_DUES',
    })
    expect(bad.success).toBe(false)

    const good = contributionFundFormSchema.safeParse({
      ...base,
      kind: 'MINISTRY_DUES',
      departmentId: 'dept-1',
    })
    expect(good.success).toBe(true)
  })

  it('requires a beneficiary for a bereavement', () => {
    const bad = contributionFundFormSchema.safeParse({
      ...base,
      kind: 'BEREAVEMENT',
    })
    expect(bad.success).toBe(false)

    const good = contributionFundFormSchema.safeParse({
      ...base,
      kind: 'BEREAVEMENT',
      beneficiaryPersonId: 'person-1',
      beneficiaryNote: 'mother, Grace Mensah',
    })
    expect(good.success).toBe(true)
  })

  it('rejects an end date before the start date', () => {
    const result = contributionFundFormSchema.safeParse({
      ...base,
      kind: 'SPECIAL',
      periodStart: '2026-10-31',
      periodEnd: '2026-10-01',
    })
    expect(result.success).toBe(false)
  })

  it('leaves optional money unset when blank', () => {
    const result = contributionFundFormSchema.parse({
      ...base,
      kind: 'SPECIAL',
      targetAmount: '',
    })
    expect(result.targetAmount).toBeUndefined()
  })
})

describe('contributionRecordFormSchema', () => {
  const base = {
    personId: 'person-1',
    contributedOn: '2026-10-04',
    method: 'CASH' as const,
  }

  it('converts the amount to pence', () => {
    expect(
      contributionRecordFormSchema.parse({ ...base, amount: '20.5' }),
    ).toMatchObject({ amount: 2050 })
  })

  it('rejects zero, negative and non-numeric amounts', () => {
    for (const amount of ['0', '-5', 'abc', '']) {
      expect(
        contributionRecordFormSchema.safeParse({ ...base, amount }).success,
      ).toBe(false)
    }
  })

  it('rejects sub-penny amounts rather than silently rounding them', () => {
    expect(
      contributionRecordFormSchema.safeParse({ ...base, amount: '1.005' })
        .success,
    ).toBe(false)
    expect(
      contributionRecordFormSchema.safeParse({ ...base, amount: '1.05' })
        .success,
    ).toBe(true)
  })

  it('rejects a malformed date', () => {
    const result = contributionRecordFormSchema.safeParse({
      ...base,
      amount: '10',
      contributedOn: '04/10/2026',
    })
    expect(result.success).toBe(false)
  })
})

/* ---- Aggregation ---------------------------------------------------------- */

let seq = 0
function rec(personId: string, pounds: string): ContributionRecord {
  return {
    id: `r${seq++}`,
    fundId: 'f1',
    personId,
    amount: poundsToPence(pounds),
    contributedOn: '2026-10-04',
    method: 'CASH',
    note: null,
    recordedById: null,
    createdAt: 0,
  }
}

describe('summariseFund', () => {
  const roster = ['a', 'b', 'c', 'd']

  it('reports zeroes for an empty fund', () => {
    const s = summariseFund({ expectedPerPerson: 2000 }, [], roster)
    expect(s.total).toBe(0)
    expect(s.paymentCount).toBe(0)
    expect(s.contributorCount).toBe(0)
    expect(s.rosterContributorCount).toBe(0)
    // 4 members × £20 still owed.
    expect(s.outstanding).toBe(8000)
  })

  it('sums instalments into one contributor', () => {
    const s = summariseFund(
      { expectedPerPerson: 2000 },
      [rec('a', '5'), rec('a', '5'), rec('a', '10')],
      roster,
    )
    expect(s.total).toBe(2000)
    expect(s.paymentCount).toBe(3)
    expect(s.contributorCount).toBe(1)
    expect(s.givenByPerson.get('a')).toBe(2000)
    // 'a' is settled; b, c, d still owe £20 each.
    expect(s.outstanding).toBe(6000)
  })

  it('does not let one member’s overpayment mask another’s shortfall', () => {
    // 'a' pays £50 against a £20 expectation; the other three have paid nothing.
    const s = summariseFund(
      { expectedPerPerson: 2000 },
      [rec('a', '50')],
      roster,
    )
    expect(s.total).toBe(5000)
    // A naive sum(expected) - sum(given) would give 8000 - 5000 = 3000. Wrong:
    // b, c and d each still owe the full £20.
    expect(s.outstanding).toBe(6000)
  })

  it('never reports negative outstanding', () => {
    const s = summariseFund(
      { expectedPerPerson: 1000 },
      [rec('a', '100'), rec('b', '100'), rec('c', '100'), rec('d', '100')],
      roster,
    )
    expect(s.outstanding).toBe(0)
  })

  it('has no outstanding figure when the fund sets no per-person amount', () => {
    const s = summariseFund(
      { expectedPerPerson: null },
      [rec('a', '10')],
      roster,
    )
    expect(s.outstanding).toBeNull()
  })

  it('counts roster contributors separately from all contributors', () => {
    // 'x' gave but is not on the roster — e.g. left the ministry after paying.
    const s = summariseFund(
      { expectedPerPerson: 2000 },
      [rec('a', '20'), rec('x', '15')],
      roster,
    )
    expect(s.total).toBe(3500)
    expect(s.contributorCount).toBe(2)
    // The "x of 4" numerator must never exceed the roster size.
    expect(s.rosterContributorCount).toBe(1)
    expect(s.rosterContributorCount).toBeLessThanOrEqual(s.rosterSize)
  })

  it('surfaces off-roster money rather than losing it', () => {
    const s = summariseFund(
      { expectedPerPerson: 2000 },
      [rec('a', '20'), rec('x', '15'), rec('y', '5'), rec('x', '5')],
      roster,
    )
    expect(s.offRoster.count).toBe(2)
    expect(s.offRoster.total).toBe(2500)
    expect(s.offRoster.personIds.sort()).toEqual(['x', 'y'])
    // Off-roster giving still counts towards the fund total…
    expect(s.total).toBe(4500)
    // …but must not reduce what roster members owe.
    expect(s.outstanding).toBe(6000)
  })

  it('keeps exact totals over many awkward amounts', () => {
    // 100 payments of £0.07. Summed as floats this drifts; as pence it cannot.
    const many = Array.from({ length: 100 }, () => rec('a', '0.07'))
    const s = summariseFund({ expectedPerPerson: null }, many, roster)
    expect(s.total).toBe(700)
    expect(penceToPounds(s.total)).toBe(7)
  })

  it('handles a person appearing only in the roster with no payments', () => {
    const s = summariseFund({ expectedPerPerson: 500 }, [rec('a', '5')], roster)
    expect(s.givenByPerson.get('b')).toBeUndefined()
    expect(s.outstanding).toBe(1500)
  })
})

describe('progressPct', () => {
  it('returns null without a usable target', () => {
    expect(progressPct(100, null)).toBeNull()
    expect(progressPct(100, 0)).toBeNull()
    expect(progressPct(100, -5)).toBeNull()
  })

  it('clamps to 0–100', () => {
    expect(progressPct(0, 10000)).toBe(0)
    expect(progressPct(5000, 10000)).toBe(50)
    expect(progressPct(10000, 10000)).toBe(100)
    // Over-target must not overflow the bar.
    expect(progressPct(25000, 10000)).toBe(100)
  })
})
