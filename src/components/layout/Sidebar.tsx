import { Fragment } from 'react'
import { Link } from '@tanstack/react-router'
import { HugeiconsIcon } from '@/lib/icons'
import { NAV_ITEMS, type NavItem } from '@/lib/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import type { AuthUser } from '@/lib/auth/session'

export function Sidebar({ user }: { user: AuthUser }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-100 md:flex">
      <SidebarNav user={user} />
    </aside>
  )
}

export function SidebarNav({
  user,
  onNavigate,
}: {
  user: AuthUser
  onNavigate?: () => void
}) {
  const items = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(user.role, item.permission),
  )
  const main = items.filter((i) => i.to !== '/settings')
  const settings = items.find((i) => i.to === '/settings')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {main.map((item, index) => {
          const prev = main[index - 1]
          const showGroup = item.group && item.group !== prev?.group
          return (
            <Fragment key={item.to}>
              {showGroup ? (
                <p className="px-3 pt-4 pb-1 text-xs font-medium tracking-wide text-neutral-500 uppercase">
                  {item.group}
                </p>
              ) : null}
              <NavLink item={item} onNavigate={onNavigate} />
            </Fragment>
          )
        })}
      </nav>
      {settings ? (
        <div className="border-t border-neutral-200 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <NavLink item={settings} onNavigate={onNavigate} />
        </div>
      ) : null}
    </div>
  )
}

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem
  onNavigate?: () => void
}) {
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      activeOptions={{ exact: item.to === '/people' }}
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-black/5 hover:text-neutral-900"
      activeProps={{
        className: 'bg-brand-600 text-white hover:bg-brand-600 hover:text-white',
      }}
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <HugeiconsIcon
            icon={item.icon}
            strokeWidth={2}
            className={
              isActive
                ? 'size-5 shrink-0 text-white'
                : 'size-5 shrink-0 text-neutral-500 group-hover:text-neutral-700'
            }
          />
          {item.label}
        </>
      )}
    </Link>
  )
}
