import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind class names, resolving conflicts (shadcn convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a GBP amount stored as a numeric string or number. */
export function formatGBP(amount: string | number): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(Number.isFinite(value) ? value : 0)
}

/** Full name, preferring the preferred name when present. */
export function displayName(person: {
  firstName: string
  lastName: string
  preferredName?: string | null
}): string {
  return `${person.preferredName?.trim() || person.firstName} ${person.lastName}`
}

/** Initials for an avatar fallback, e.g. "John Mensah" → "JM". */
export function initials(...parts: Array<string | null | undefined>): string {
  return parts
    .filter((p): p is string => Boolean(p && p.trim()))
    .map((p) => p.trim()[0]!)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Format an ISO `YYYY-MM-DD` date as a readable UK date, e.g. "9 Aug 2026". */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return '—'
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Age in whole years from an ISO `YYYY-MM-DD` date of birth. */
export function ageFromDob(iso?: string | null): number | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  const today = new Date()
  let age = today.getFullYear() - y
  const beforeBirthday =
    today.getMonth() + 1 < m ||
    (today.getMonth() + 1 === m && today.getDate() < d)
  if (beforeBirthday) age -= 1
  return age
}
