import { redirect } from '@tanstack/react-router'
import { hasPermission, type Permission } from './permissions'
import type { AuthUser } from './session'

/*
 * Route-level authorization helper. Called from a route's `beforeLoad` with the
 * user from context; redirects to the dashboard if the capability is missing.
 * This keeps permission checks declarative and central rather than scattered in
 * components (spec section 17).
 */
export function requirePermission(
  user: AuthUser,
  permission: Permission,
): void {
  if (!hasPermission(user.role, permission)) {
    throw redirect({ to: '/dashboard' })
  }
}
