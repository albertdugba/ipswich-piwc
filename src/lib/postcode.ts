export interface PostcodeResult {
  postcode: string
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
  if (res.status === 404) return null
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
