import { createServerFn } from '@tanstack/react-start'
import type { AppRole } from '@/domain/enums'

/*
 * The authenticated user as the app sees it. Firebase owns the identity; this
 * shape is what our app cares about (role drives permissions.ts).
 */
export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: AppRole
  personId: string | null
}

/*
 * ---------------------------------------------------------------------------
 * MOCK SESSION (foundation phase)
 * ---------------------------------------------------------------------------
 * Auth is scaffolded but not yet wired to Firebase (per the setup decision).
 * `getCurrentUser` currently returns a fixed CHURCH_ADMIN so the authenticated
 * shell is usable end-to-end.
 *
 * To wire real auth later, this handler should:
 *   1. Read the Firebase session cookie / ID token from the request.
 *   2. Verify it with firebase-admin (see src/lib/firebase/admin.ts).
 *   3. Look up the matching `users` row in Postgres for the role + personId.
 *   4. Return null when unauthenticated (the _app route redirects to /login).
 * The call sites (_app beforeLoad, useCurrentUser) already handle a null user.
 */
const MOCK_USER: AuthUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@ipswich-piwc.example',
  displayName: 'Church Admin',
  role: 'CHURCH_ADMIN',
  personId: null,
}

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthUser | null> => {
    // TODO(auth): verify Firebase session and load the real user.
    return MOCK_USER
  },
)
