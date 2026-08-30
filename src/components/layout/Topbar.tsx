import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  BellIcon,
  ChurchIcon,
  HugeiconsIcon,
  MenuIcon,
  SearchIcon,
} from '@/lib/icons'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SidebarNav } from './Sidebar'
import { initials } from '@/lib/utils'
import type { AuthUser } from '@/lib/auth/session'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  PASTOR: 'Pastor',
  CHURCH_ADMIN: 'Church Admin',
  DEPARTMENT_LEADER: 'Department Leader',
  FINANCE_USER: 'Finance',
  ATTENDANCE_VOLUNTEER: 'Attendance Volunteer',
  MEMBER: 'Member',
}

export function Topbar({ user }: { user: AuthUser }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 bg-neutral-900 px-3 text-white sm:gap-4">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          aria-label="Open menu"
          className="flex size-9 items-center justify-center rounded-lg text-white hover:bg-white/10 md:hidden"
        >
          <HugeiconsIcon icon={MenuIcon} className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-neutral-100 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav user={user} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <Link
        to="/dashboard"
        className="flex items-center gap-2.5 sm:w-[13.75rem]"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white ring-1 ring-gold-400">
          <HugeiconsIcon icon={ChurchIcon} className="size-5" />
        </span>
        <span className="hidden text-sm font-semibold tracking-tight sm:block">
          Ipswich PIWC
        </span>
      </Link>

      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-xl">
          <HugeiconsIcon
            icon={SearchIcon}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/50"
          />
          <input
            type="search"
            placeholder="Search people, ministries…"
            aria-label="Search"
            className="h-9 w-full rounded-lg border border-white/15 bg-white/10 pr-10 pl-9 text-sm text-white placeholder:text-white/50 focus:border-white/30 focus:bg-white/15 focus:outline-none"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-white/15 px-1.5 py-0.5 text-[10px] font-medium text-white/50 sm:block">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Notifications"
          className="flex size-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
        >
          <HugeiconsIcon icon={BellIcon} className="size-5" />
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg py-1 pr-1 pl-2 hover:bg-white/10"
        >
          <span className="hidden text-right leading-tight sm:block">
            <span className="block text-xs font-medium">
              {user.displayName}
            </span>
            <span className="block text-[10px] text-white/60">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </span>
          <span className="flex size-7 items-center justify-center rounded-md bg-brand-600 text-xs font-semibold text-white">
            {initials(user.displayName)}
          </span>
        </button>
      </div>
    </header>
  )
}
