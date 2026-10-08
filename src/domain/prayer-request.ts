import { z } from 'zod'
import { isUkPhone, normalizeUkPhone } from '@/lib/phone'

export type PrayerRequestStatus = 'NEW' | 'PRAYING' | 'ANSWERED'

export interface PrayerRequest {
  id: string
  request: string
  anonymous: boolean
  name: string | null
  phone: string | null
  status: PrayerRequestStatus
  createdAt: number
}

/**
 * Public prayer request form. Anonymous by choice: when `anonymous` is true
 * no name or phone number is kept, even if they were typed in.
 */
export const prayerRequestSchema = z
  .object({
    request: z
      .string()
      .trim()
      .min(5, 'Tell us a little about what to pray for')
      .max(2000, 'Please keep it under 2,000 characters'),
    anonymous: z.boolean(),
    name: z.string().trim().max(120).optional(),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || isUkPhone(v), 'Enter a valid UK phone number'),
  })
  .superRefine((v, ctx) => {
    if (!v.anonymous && !v.name) {
      ctx.addIssue({
        code: 'custom',
        path: ['name'],
        message: 'Add your name, or choose to stay anonymous',
      })
    }
  })
  .transform((v) => ({
    request: v.request,
    anonymous: v.anonymous,
    name: v.anonymous ? null : v.name || null,
    // Stored in one consistent format (+44…).
    phone: v.anonymous || !v.phone ? null : normalizeUkPhone(v.phone),
  }))

export type PrayerRequestInput = z.input<typeof prayerRequestSchema>
export type PrayerRequestValues = z.output<typeof prayerRequestSchema>
