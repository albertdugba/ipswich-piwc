import { z } from 'zod'
import type { DepartmentRole } from './enums'

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
export type DepartmentFormInput = z.input<typeof departmentFormSchema>

export const emptyDepartmentForm = {
  name: '',
  isActive: true,
} satisfies Partial<DepartmentFormValues>

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
