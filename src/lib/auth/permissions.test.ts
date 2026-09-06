import { describe, expect, it } from 'vitest'
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  ROLE_PERMISSIONS,
} from './permissions'

describe('permissions', () => {
  it('grants SUPER_ADMIN every capability', () => {
    expect(hasPermission('SUPER_ADMIN', 'users:manage')).toBe(true)
    expect(hasPermission('SUPER_ADMIN', 'contributions:write')).toBe(true)
    expect(hasPermission('SUPER_ADMIN', 'people:read_sensitive')).toBe(true)
  })

  it('does not let a department leader see church-wide financials write nor sensitive data', () => {
    expect(hasPermission('DEPARTMENT_LEADER', 'people:read_sensitive')).toBe(
      false,
    )
    expect(hasPermission('DEPARTMENT_LEADER', 'settings:manage')).toBe(false)
    expect(hasPermission('DEPARTMENT_LEADER', 'departments:manage_own')).toBe(
      true,
    )
  })

  it('limits an attendance volunteer to attendance + basic people read', () => {
    expect(hasPermission('ATTENDANCE_VOLUNTEER', 'attendance:write')).toBe(true)
    expect(hasPermission('ATTENDANCE_VOLUNTEER', 'people:read')).toBe(true)
    expect(hasPermission('ATTENDANCE_VOLUNTEER', 'people:read_sensitive')).toBe(
      false,
    )
    expect(hasPermission('ATTENDANCE_VOLUNTEER', 'contributions:read')).toBe(
      false,
    )
  })

  it('gives a plain MEMBER no admin capabilities', () => {
    expect(ROLE_PERMISSIONS.MEMBER).toHaveLength(0)
    expect(hasPermission('MEMBER', 'people:read')).toBe(false)
  })

  it('treats a null/undefined role as unauthorised', () => {
    expect(hasPermission(null, 'people:read')).toBe(false)
    expect(hasPermission(undefined, 'settings:manage')).toBe(false)
  })

  it('lets a church admin write every module they administer', () => {
    expect(
      hasAllPermissions('CHURCH_ADMIN', [
        'people:write',
        'departments:write',
        'attendance:write',
        'contributions:write',
      ]),
    ).toBe(true)
  })

  it('keeps contribution figures away from roles without read_amounts', () => {
    expect(hasPermission('DEPARTMENT_LEADER', 'contributions:read')).toBe(true)
    expect(
      hasPermission('DEPARTMENT_LEADER', 'contributions:read_amounts'),
    ).toBe(false)
    expect(hasPermission('FINANCE_USER', 'contributions:read_amounts')).toBe(
      true,
    )
    expect(hasPermission('ATTENDANCE_VOLUNTEER', 'contributions:read')).toBe(
      false,
    )
  })

  it('supports all/any aggregate checks', () => {
    expect(
      hasAllPermissions('CHURCH_ADMIN', ['people:read', 'people:write']),
    ).toBe(true)
    expect(
      hasAllPermissions('FINANCE_USER', [
        'contributions:write',
        'settings:manage',
      ]),
    ).toBe(false)
    expect(
      hasAnyPermission('FINANCE_USER', [
        'settings:manage',
        'contributions:read',
      ]),
    ).toBe(true)
  })
})
