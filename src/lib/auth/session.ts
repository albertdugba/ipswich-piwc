import { createServerFn } from '@tanstack/react-start'
import type { AppRole } from '@/domain/enums'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: AppRole
  personId: string | null
}

const MOCK_USER: AuthUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@ipswich-piwc.example',
  displayName: 'Church Admin',
  role: 'CHURCH_ADMIN',
  personId: null,
}

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthUser | null> => {
    return MOCK_USER
  },
)
