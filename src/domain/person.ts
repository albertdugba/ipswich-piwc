import { z } from 'zod'
import {
  genderValues,
  maritalStatusValues,
  membershipStatusValues,
} from './enums'
import type { Gender, MaritalStatus, MembershipStatus } from './enums'

export interface Person {
  id: string
  firstName: string
  lastName: string
  preferredName?: string | null
  gender?: Gender | null
  dateOfBirth?: string | null

  phone?: string | null
  email?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  postcode?: string | null

  photoUrl?: string | null

  membershipStatus: MembershipStatus
  firstAttendedOn?: string | null
  membershipDate?: string | null

  maritalStatus?: MaritalStatus | null
  marriageDate?: string | null

  notes?: string | null
  smsOptOut?: boolean | null
  isActive: boolean

  createdAt: number
  updatedAt: number
}

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))

const optionalDate = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use a valid date')
  .transform((v) => (v ? v : undefined))

export const personFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  preferredName: optionalString,
  gender: z.enum(genderValues).optional(),
  dateOfBirth: optionalDate,

  phone: optionalString,
  email: z
    .string()
    .trim()
    .email('Enter a valid email')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  addressLine1: optionalString,
  addressLine2: optionalString,
  city: optionalString,
  postcode: optionalString,

  membershipStatus: z.enum(membershipStatusValues),
  firstAttendedOn: optionalDate,
  membershipDate: optionalDate,

  maritalStatus: z.enum(maritalStatusValues).optional(),
  marriageDate: optionalDate,

  notes: optionalString,
  smsOptOut: z.boolean(),
  isActive: z.boolean(),
})

export type PersonFormValues = z.infer<typeof personFormSchema>

export type PersonFormInput = z.input<typeof personFormSchema>

export const emptyPersonForm = {
  firstName: '',
  lastName: '',
  membershipStatus: 'VISITOR',
  smsOptOut: false,
  isActive: true,
} satisfies Partial<PersonFormValues>
