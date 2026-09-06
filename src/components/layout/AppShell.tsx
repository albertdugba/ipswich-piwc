import type { ReactNode } from 'react'
import type { AuthUser } from '@/lib/auth/session'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileTabBar } from './MobileTabBar'

export function AppShell({
  user,
  children,
}: {
  user: AuthUser
  children: ReactNode
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-neutral-100">
      <Topbar user={user} />
      <div className="flex min-h-0 flex-1">
        <Sidebar user={user} />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-neutral-50">
          <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-10 lg:px-10">
            {children}
          </div>
        </main>
      </div>
      <MobileTabBar user={user} />
    </div>
  )
}
