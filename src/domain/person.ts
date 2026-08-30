import { z } from 'zod'
import {
  genderValues,
  maritalStatusValues,
  membershipStatusValues,
} from './enums'
import type { Gender, MaritalStatus, MembershipStatus } from './enums'

/*
 * The Person is the central entity of the system. Members, visitors, men,
 * women and children are ALL Person records — differentiated by
 * `membershipStatus`, never split into separate collections.
 *
 * Stored in the Firestore `people` collection. Date-only fields
 * (dateOfBirth, marriageDate…) are ISO `YYYY-MM-DD` strings so we can do
 * month/day birthday queries later without timezone drift; audit timestamps
 * are epoch milliseconds set on write.
 */
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
  isActive: boolean

  createdAt: number
  updatedAt: number
}

// Coerce empty form strings to undefined so optional fields stay clean.
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

/*
 * Validation schema for the add/edit member form (Rule 8: Zod at boundaries).
 * Only first and last name are required — a visitor can be captured with
 * minimal information.
 */
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
  isActive: z.boolean(),
})

/** Validated output — what gets written to Firestore. */
export type PersonFormValues = z.infer<typeof personFormSchema>

/*
 * What the form holds while being edited, before Zod trims and drops empties.
 * react-hook-form is typed on this so `''` is a legal in-progress value for an
 * optional field; `handleSubmit` hands the parsed `PersonFormValues` to onSubmit.
 */
export type PersonFormInput = z.input<typeof personFormSchema>

/** Sensible defaults for the "add member" flow (a new person starts as a
 *  visitor). Only the fields the form needs a starting value for. */
export const emptyPersonForm = {
  firstName: '',
  lastName: '',
  membershipStatus: 'VISITOR',
  isActive: true,
} satisfies Partial<PersonFormValues>
