import { Link } from '@tanstack/react-router'
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
  return (
    <header
      className="flex min-h-14 shrink-0 items-center gap-2 bg-neutral-900 px-3 text-white sm:gap-4"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <Link to="/dashboard" className="flex items-center gap-2.5 sm:w-55">
        <img
          src="/piwc-logo.png"
          alt="Ipswich PIWC logo"
          className="size-8 shrink-0 rounded-full object-contain"
        />
        <span className="text-sm font-semibold tracking-tight">
          Ipswich PIWC
        </span>
      </Link>

      <div className="flex flex-1 items-center justify-end gap-1">
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
            {initials(...user.displayName.split(/\s+/))}
          </span>
        </button>
      </div>
    </header>
  )
}
