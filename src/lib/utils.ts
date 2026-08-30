import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatGBP(amount: string | number): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(Number.isFinite(value) ? value : 0)
}

export function displayName(person: {
  firstName: string
  lastName: string
  preferredName?: string | null
}): string {
  return `${person.preferredName?.trim() || person.firstName} ${person.lastName}`
}

export function initials(...parts: Array<string | null | undefined>): string {
  return parts
    .filter((p): p is string => Boolean(p && p.trim()))
    .map((p) => p.trim()[0]!)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

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
