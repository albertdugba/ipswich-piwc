import type { AppRole } from '@/domain/enums'

export const PERMISSIONS = [
  'people:read',
  'people:write',
  'people:read_sensitive',
  'departments:read',
  'departments:write',
  'departments:manage_own',
  'attendance:read',
  'attendance:write',
  'contributions:read',
  'contributions:write',
  'contributions:read_amounts',
  'reminders:read',
  'prayer:read',
  'prayer:moderate',
  'testimonies:read',
  'testimonies:moderate',
  'settings:manage',
  'users:manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const ALL: Permission[] = [...PERMISSIONS]

export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  SUPER_ADMIN: ALL,

  PASTOR: [
    'people:read',
    'people:read_sensitive',
    'departments:read',
    'attendance:read',
    'contributions:read',
    'contributions:read_amounts',
    'reminders:read',
    'prayer:read',
    'prayer:moderate',
    'testimonies:read',
    'testimonies:moderate',
  ],

  CHURCH_ADMIN: [
    'people:read',
    'people:write',
    'people:read_sensitive',
    'departments:read',
    'departments:write',
    'attendance:read',
    'attendance:write',
    'contributions:read',
    'contributions:read_amounts',
    'contributions:write',
    'reminders:read',
    'prayer:read',
    'prayer:moderate',
    'testimonies:read',
    'testimonies:moderate',
    'settings:manage',
  ],

  DEPARTMENT_LEADER: [
    'people:read',
    'departments:read',
    'departments:manage_own',
    'attendance:read',
    'contributions:read',
    'contributions:write',
    'reminders:read',
  ],

  FINANCE_USER: [
    'people:read',
    'contributions:read',
    'contributions:read_amounts',
    'contributions:write',
    'reminders:read',
  ],

  ATTENDANCE_VOLUNTEER: ['people:read', 'attendance:read', 'attendance:write'],

  MEMBER: [],
}

export function hasPermission(
  role: AppRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function hasAllPermissions(
  role: AppRole | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

export function hasAnyPermission(
  role: AppRole | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p))
}
