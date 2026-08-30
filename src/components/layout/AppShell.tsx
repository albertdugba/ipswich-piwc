import type { ReactNode } from 'react'
import type { AuthUser } from '@/lib/auth/session'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell({
  user,
  children,
}: {
  user: AuthUser
  children: ReactNode
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-100">
      <Topbar user={user} />
      <div className="flex min-h-0 flex-1">
        <Sidebar user={user} />
        <main className="min-w-0 flex-1 overflow-y-auto bg-neutral-50">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  )
}
