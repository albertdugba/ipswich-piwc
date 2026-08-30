import { describe, expect, it } from 'vitest'
import { normalisePhone, smsHref, whatsappHref } from './messages'

describe('normalisePhone', () => {
  it('converts UK national numbers to E.164', () => {
    expect(normalisePhone('07700 900123')).toBe('+447700900123')
    expect(normalisePhone('07700900123')).toBe('+447700900123')
    expect(normalisePhone('(01473) 123456')).toBe('+441473123456')
  })

  it('preserves numbers already in international form', () => {
    expect(normalisePhone('+44 7700 900123')).toBe('+447700900123')
    expect(normalisePhone('0044 7700 900123')).toBe('+447700900123')
    expect(normalisePhone('447700900123')).toBe('+447700900123')
  })

  it('keeps non-UK country codes intact', () => {
    expect(normalisePhone('+233 24 123 4567')).toBe('+233241234567')
  })

  it('returns null when there is nothing dialable', () => {
    expect(normalisePhone(null)).toBeNull()
    expect(normalisePhone('')).toBeNull()
    expect(normalisePhone('   ')).toBeNull()
    expect(normalisePhone('no number')).toBeNull()
  })
})

describe('message links', () => {
  it('encodes the characters that would otherwise truncate the body', () => {
    const href = smsHref('07700900123', "God's blessing & peace #1")
    expect(href).toContain('sms:+447700900123')
    // & and # would end the query; apostrophes are legal in a URI and survive.
    expect(href).toContain('%26')
    expect(href).toContain('%23')
    expect(href).toContain("God's")
  })

  it('builds a wa.me link without the plus', () => {
    expect(whatsappHref('07700900123', 'hi')).toBe(
      'https://wa.me/447700900123?text=hi',
    )
  })

  it('returns null rather than a broken link when there is no number', () => {
    expect(smsHref(null, 'hi')).toBeNull()
    expect(whatsappHref('', 'hi')).toBeNull()
  })
})
