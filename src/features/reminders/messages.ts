import type { Celebration } from '@/domain/celebration'
import { displayName } from '@/lib/utils'

const CHURCH = 'Ipswich PIWC'

export function greetingText(c: Celebration): string {
  const name = c.person.preferredName?.trim() || c.person.firstName
  switch (c.kind) {
    case 'BIRTHDAY':
      return c.isMilestone && c.years
        ? `Happy ${c.years}th birthday, ${name}! What a milestone. The whole ${CHURCH} family is celebrating with you today and praying God's richest blessing over this new year.`
        : `Happy birthday, ${name}! The ${CHURCH} family is celebrating with you today. May the Lord bless you and keep you.`
    case 'MARRIAGE_ANNIVERSARY':
      return c.years
        ? `Happy ${c.years}th wedding anniversary, ${name}! ${CHURCH} thanks God for your marriage and prays for many more years together.`
        : `Happy wedding anniversary, ${name}! ${CHURCH} thanks God for your marriage.`
    case 'MEMBERSHIP_ANNIVERSARY':
      return c.years
        ? `${name}, today marks ${c.years} year${c.years === 1 ? '' : 's'} since you joined ${CHURCH}. Thank you for all you are to this church family.`
        : `${name}, thank you for all you are to the ${CHURCH} family.`
  }
}

/**
 * Strips spaces and punctuation, and converts a UK national number to E.164.
 * Returns null when there is nothing dialable.
 */
export function normalisePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  const plus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null

  if (plus) return `+${digits}`
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  if (digits.startsWith('0')) return `+44${digits.slice(1)}`
  if (digits.startsWith('44')) return `+${digits}`
  return `+${digits}`
}

/** `sms:` URL that opens the leader's own messaging app with the text prefilled. */
export function smsHref(
  phone: string | null | undefined,
  body: string,
): string | null {
  const number = normalisePhone(phone)
  if (!number) return null
  return `sms:${number}?&body=${encodeURIComponent(body)}`
}

export function whatsappHref(
  phone: string | null | undefined,
  body: string,
): string | null {
  const number = normalisePhone(phone)
  if (!number) return null
  return `https://wa.me/${number.replace('+', '')}?text=${encodeURIComponent(body)}`
}

export function celebrationTitle(c: Celebration): string {
  const name = displayName(c.person)
  switch (c.kind) {
    case 'BIRTHDAY':
      return c.years ? `${name} turns ${c.years}` : `${name}'s birthday`
    case 'MARRIAGE_ANNIVERSARY':
      return c.years
        ? `${name} — ${c.years} years married`
        : `${name}'s wedding anniversary`
    case 'MEMBERSHIP_ANNIVERSARY':
      return c.years
        ? `${name} — ${c.years} year${c.years === 1 ? '' : 's'} at the church`
        : `${name}'s membership anniversary`
  }
}
