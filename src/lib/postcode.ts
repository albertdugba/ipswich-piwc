/*
 * UK postcode lookup via postcodes.io — a free, open, key-less, CORS-enabled
 * service (https://postcodes.io). It returns geographic data for a postcode
 * (town/district, region, country, coordinates) which we use to validate the
 * postcode and auto-fill the town on the member form.
 *
 * NOTE: postcodes.io is NOT the Royal Mail PAF, so it cannot return a list of
 * individual house/street addresses to pick from — the person still types
 * their house number and street. A full "select your address" dropdown would
 * require a PAF-licensed provider.
 */
export interface PostcodeResult {
  /** Normalised postcode, e.g. "IP1 1AA". */
  postcode: string
  /** Best-effort town/district (postcodes.io has no true PAF post town). */
  town: string | null
  region: string | null
  country: string | null
}

export async function lookupPostcode(
  input: string,
): Promise<PostcodeResult | null> {
  const pc = input.trim()
  if (!pc) return null

  const res = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`,
  )
  if (res.status === 404) return null // not a valid/known postcode
  if (!res.ok) {
    throw new Error('Postcode lookup failed. Please try again.')
  }

  const json = (await res.json()) as {
    result: {
      postcode: string
      admin_district?: string | null
      parish?: string | null
      region?: string | null
      country?: string | null
    } | null
  }
  const r = json.result
  if (!r) return null

  return {
    postcode: r.postcode,
    town: r.admin_district ?? r.parish ?? null,
    region: r.region ?? null,
    country: r.country ?? null,
  }
}
