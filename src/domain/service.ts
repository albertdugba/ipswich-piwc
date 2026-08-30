import { z } from 'zod'

/*
 * A Service is a datable gathering (e.g. "Sunday Worship — 9 August 2026").
 * Attendance is recorded per person per service.
 *
 * Firestore collections:
 *   services            — one doc per gathering; `presentCount` is denormalised
 *                         so the list/summary/dashboard read without extra reads
 *   attendanceRecords   — one doc per PRESENT person, id `${serviceId}__${personId}`
 *
 * Phase 4 keeps attendance minimal (present-only): a record exists iff the
 * person was present. Absent is simply the absence of a record. Richer statuses
 * (visitor / child / excused) can be added later without breaking this shape.
 */
export interface Service {
  id: string
  name: string
  serviceDate: string // ISO YYYY-MM-DD
  notes?: string | null
  presentCount: number
  createdAt: number
}

export interface AttendanceRecord {
  id: string
  serviceId: string
  personId: string
  createdAt: number
}

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))

export const serviceFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  serviceDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date'),
  notes: optionalString,
})

export type ServiceFormValues = z.infer<typeof serviceFormSchema>
/** Pre-validation shape held by react-hook-form. */
export type ServiceFormInput = z.input<typeof serviceFormSchema>

/** Today as an ISO YYYY-MM-DD string (local time). */
export function todayIso(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
