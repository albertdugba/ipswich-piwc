import { z } from 'zod'
import type { DepartmentRole } from './enums'

/*
 * Departments / ministries are DATA, not hard-coded (Rule 4). A person can
 * belong to MANY departments via DepartmentMembership — one Person record, many
 * memberships (never duplicated people, Rule 3).
 *
 * Firestore collections:
 *   departments            — one doc per ministry
 *   departmentMemberships  — join docs, id = `${departmentId}__${personId}`
 * Leadership is expressed as a membership `role` (LEADER / ASSISTANT_LEADER),
 * not a field on the department, so leadership history is preserved and a
 * person can lead one ministry while just attending another.
 */
export interface Department {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface DepartmentMembership {
  id: string
  departmentId: string
  personId: string
  role: DepartmentRole
  joinedOn: number
  isActive: boolean
}

export const departmentFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  isActive: z.boolean(),
})

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>
/** Pre-validation shape held by react-hook-form. */
export type DepartmentFormInput = z.input<typeof departmentFormSchema>

export const emptyDepartmentForm = {
  name: '',
  isActive: true,
} satisfies Partial<DepartmentFormValues>

/*
 * The church's common ministries (spec section 7). Used only as a one-click
 * "seed" convenience for an empty list — they are created as ordinary
 * department documents, so they remain fully editable/data-driven.
 */
export const DEFAULT_MINISTRIES: { name: string; description: string }[] = [
  { name: 'Children Ministry', description: 'Ministry to children.' },
  { name: "Men's Ministry", description: 'Ministry to men.' },
  { name: "Women's Ministry", description: 'Ministry to women.' },
  { name: 'Youth Ministry', description: 'Ministry to young people.' },
  { name: 'Choir', description: 'Music and worship ministry.' },
  { name: 'Prayer Ministry', description: 'Intercession and prayer.' },
  { name: 'Media', description: 'Sound, streaming and media.' },
  { name: 'Evangelism', description: 'Outreach and evangelism.' },
]
