import { describe, expect, it } from 'vitest'
import { isUkPhone, normalizeUkPhone } from './phone'

describe('normalizeUkPhone', () => {
  it.each([
    ['07700 900123', '+447700900123'],
    ['07700900123', '+447700900123'],
    ['+44 7700 900123', '+447700900123'],
    ['+44 (0)7700 900123', '+447700900123'],
    ['0044 7700 900123', '+447700900123'],
    ['(01473) 123456', '+441473123456'],
    ['01473-123-456', '+441473123456'],
    ['020 7946 0958', '+442079460958'],
    ['0800 123 4567', '+448001234567'],
  ])('accepts %s', (input, expected) => {
    expect(normalizeUkPhone(input)).toBe(expected)
  })

  it.each([
    ['', 'empty'],
    ['ama@example.com', 'not a number'],
    ['+233 24 123 4567', 'non-UK country code'],
    ['001 202 555 0143', 'non-UK international prefix'],
    ['07700 9001', 'too short'],
    ['07700 900123 45', 'too long'],
    ['04700 900123', 'unused 04 range'],
    ['7700 900123', 'missing leading 0'],
  ])('rejects %s (%s)', (input) => {
    expect(isUkPhone(input)).toBe(false)
  })
})
