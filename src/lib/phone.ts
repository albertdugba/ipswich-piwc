/**
 * UK phone numbers.
 *
 * Accepts the ways people actually type them — `07700 900123`,
 * `+44 7700 900123`, `+44 (0)7700 900123`, `0044 7700 900123`,
 * `(01473) 123456` — and normalises to E.164 (`+447700900123`) so numbers
 * are stored one consistent way.
 *
 * A UK number is a leading 0 followed by 9 or 10 digits, where the first
 * digit after the 0 is 1, 2, 3, 5, 7, 8 or 9 (geographic, non-geographic,
 * mobile and special-service ranges). 04 and 06 are not in use.
 */
export function normalizeUkPhone(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null
  // Only digits, spaces, dashes, dots, brackets and a leading + are allowed.
  if (!/^\+?[\d\s().-]+$/.test(raw)) return null

  let digits = raw
    // "+44 (0)7700…" — the bracketed trunk 0 is dropped after the country code.
    .replace(/^(\+|00)\s*44\s*\(0\)/, '+44')
    .replace(/[\s().-]/g, '')

  if (digits.startsWith('+44')) digits = `0${digits.slice(3)}`
  else if (digits.startsWith('0044')) digits = `0${digits.slice(4)}`
  else if (digits.startsWith('+') || digits.startsWith('00')) return null

  if (!/^0[1235789]\d{8,9}$/.test(digits)) return null
  return `+44${digits.slice(1)}`
}

export function isUkPhone(input: string): boolean {
  return normalizeUkPhone(input) !== null
}
