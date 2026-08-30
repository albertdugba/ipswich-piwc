import type { AppRole } from '@/domain/enums'

/*
 * Central permission model. Every access decision in the app resolves through
 * this file — never sprinkle role string comparisons across UI components
 * (spec section 17: "Implement permissions centrally").
 *
 * Permissions are coarse capabilities ("resource:action"). ROW-LEVEL scoping
 * (e.g. a DEPARTMENT_LEADER only managing THEIR department, a MEMBER only
 * seeing their own profile) is enforced in the data layer in later phases; this
 * matrix answers the capability question only.
 */
export const PERMISSIONS = [
  'people:read',
  'people:write',
  'people:read_sensitive', // phone, address, notes, pastoral info
  'departments:read',
  'departments:write',
  'departments:manage_own',
  'attendance:read',
  'attendance:write',
  'contributions:read',
  'contributions:write',
  'contributions:read_amounts', // the figures themselves, not just who gave
  'reminders:read',
  'prayer:read',
  'prayer:moderate',
  'testimonies:read',
  'testimonies:moderate',
  'analytics:read',
  'settings:manage',
  'users:manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const ALL: Permission[] = [...PERMISSIONS]

/*
 * Role → capabilities. Derived directly from the role descriptions in the spec.
 * Notably: DEPARTMENT_LEADER does NOT get church-wide financials or sensitive
 * personal data; ATTENDANCE_VOLUNTEER cannot read sensitive info.
 */
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
    'analytics:read',
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
    'analytics:read',
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

/** True if the role has the given capability. */
export function hasPermission(
  role: AppRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

/** True if the role has EVERY listed capability. */
export function hasAllPermissions(
  role: AppRole | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

/** True if the role has AT LEAST ONE of the listed capabilities. */
export function hasAnyPermission(
  role: AppRole | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p))
}
