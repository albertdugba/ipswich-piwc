import { redirect } from '@tanstack/react-router'
import { hasPermission, type Permission } from './permissions'
import type { AuthUser } from './session'

export function requirePermission(
  user: AuthUser,
  permission: Permission,
): void {
  if (!hasPermission(user.role, permission)) {
    throw redirect({ to: '/dashboard' })
  }
}
