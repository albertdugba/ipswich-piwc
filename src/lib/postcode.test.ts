import { afterEach, describe, expect, it, vi } from 'vitest'
import { lookupPostcode } from './postcode'

function mockFetch(status: number, body?: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      status,
      ok: status >= 200 && status < 300,
      json: async () => body,
    })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('lookupPostcode', () => {
  it('returns null for a blank input without calling the API', async () => {
    const spy = vi.fn()
    vi.stubGlobal('fetch', spy)
    expect(await lookupPostcode('   ')).toBeNull()
    expect(spy).not.toHaveBeenCalled()
  })

  it('maps a valid postcode to town/region/country', async () => {
    mockFetch(200, {
      result: {
        postcode: 'IP1 1AA',
        admin_district: 'Ipswich',
        region: 'East of England',
        country: 'England',
      },
    })
    expect(await lookupPostcode('ip1 1aa')).toEqual({
      postcode: 'IP1 1AA',
      town: 'Ipswich',
      region: 'East of England',
      country: 'England',
    })
  })

  it('falls back to parish when there is no admin_district', async () => {
    mockFetch(200, {
      result: { postcode: 'AB1 2CD', parish: 'Someparish', region: null },
    })
    const result = await lookupPostcode('AB1 2CD')
    expect(result?.town).toBe('Someparish')
  })

  it('returns null for an unknown postcode (404)', async () => {
    mockFetch(404, { status: 404, error: 'Postcode not found' })
    expect(await lookupPostcode('ZZ1 1ZZ')).toBeNull()
  })

  it('throws on a server error', async () => {
    mockFetch(500)
    await expect(lookupPostcode('IP1 1AA')).rejects.toThrow(/lookup failed/i)
  })
})
