import { describe, expect, it } from 'vitest'
import { prayerRequestSchema } from './prayer-request'

describe('prayerRequestSchema', () => {
  it('drops name and phone when anonymous', () => {
    const out = prayerRequestSchema.parse({
      request: 'Please pray for my family',
      anonymous: true,
      name: 'Ama',
      phone: '07700 900123',
    })
    expect(out).toEqual({
      request: 'Please pray for my family',
      anonymous: true,
      name: null,
      phone: null,
    })
  })

  it('requires a name when not anonymous', () => {
    const res = prayerRequestSchema.safeParse({
      request: 'Please pray for my exams',
      anonymous: false,
    })
    expect(res.success).toBe(false)
    expect(res.error?.issues[0]?.path).toEqual(['name'])
  })

  it('keeps name and optional phone when shared', () => {
    const out = prayerRequestSchema.parse({
      request: 'Healing for my mum',
      anonymous: false,
      name: 'Kofi',
      phone: '',
    })
    expect(out.name).toBe('Kofi')
    expect(out.phone).toBeNull()
  })

  it('rejects a too-short request', () => {
    expect(
      prayerRequestSchema.safeParse({ request: 'hi', anonymous: true }).success,
    ).toBe(false)
  })

  it('accepts UK phone formats and stores them as +44', () => {
    for (const phone of [
      '07700 900123',
      '+44 7700 900123',
      '+44 (0)7700 900123',
    ]) {
      expect(
        prayerRequestSchema.parse({
          request: 'Please pray for me',
          anonymous: false,
          name: 'Ama',
          phone,
        }).phone,
      ).toBe('+447700900123')
    }
  })

  it('rejects numbers that are not UK numbers', () => {
    const res = prayerRequestSchema.safeParse({
      request: 'Please pray for me',
      anonymous: false,
      name: 'Kofi',
      phone: '+233 24 123 4567',
    })
    expect(res.success).toBe(false)
    expect(res.error?.issues[0]?.message).toBe('Enter a valid UK phone number')
  })

  it('rejects something that is not a phone number', () => {
    const res = prayerRequestSchema.safeParse({
      request: 'Please pray for me',
      anonymous: false,
      name: 'Ama',
      phone: 'ama@example.com',
    })
    expect(res.success).toBe(false)
    expect(res.error?.issues[0]?.path).toEqual(['phone'])
  })
})
