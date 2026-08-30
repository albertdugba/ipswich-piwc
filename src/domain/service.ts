import { z } from 'zod'

export interface Service {
  id: string
  name: string
  serviceDate: string
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
export type ServiceFormInput = z.input<typeof serviceFormSchema>

export function todayIso(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
