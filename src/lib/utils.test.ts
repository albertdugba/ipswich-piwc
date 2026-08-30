import { describe, expect, it } from 'vitest'
import { cn, displayName, formatGBP } from './utils'

describe('cn', () => {
  it('joins truthy class names and drops falsy ones', () => {
    expect(cn('a', false, 'b', null, undefined, 'c')).toBe('a b c')
  })
})

describe('formatGBP', () => {
  it('formats numbers and numeric strings as GBP', () => {
    expect(formatGBP(20)).toBe('£20.00')
    expect(formatGBP('850.5')).toBe('£850.50')
  })

  it('falls back to £0.00 for non-numeric input', () => {
    expect(formatGBP('not-a-number')).toBe('£0.00')
  })
})

describe('displayName', () => {
  it('prefers the preferred name when present', () => {
    expect(
      displayName({
        firstName: 'Jonathan',
        lastName: 'Mensah',
        preferredName: 'John',
      }),
    ).toBe('John Mensah')
  })

  it('falls back to the first name', () => {
    expect(displayName({ firstName: 'Mary', lastName: 'Mensah' })).toBe(
      'Mary Mensah',
    )
  })
})
