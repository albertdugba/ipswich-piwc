import { Fragment } from 'react'
import { Link } from '@tanstack/react-router'
import { HugeiconsIcon } from '@/lib/icons'
import { NAV_ITEMS, type NavItem } from '@/lib/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import type { AuthUser } from '@/lib/auth/session'

/*
 * Shopify-style left navigation: a light-grey rail with white "pill" active
 * states, small section headers and Settings pinned to the bottom. Items are
 * filtered against the current user's permissions (the rail itself holds no
 * role logic). `SidebarNav` is shared by the desktop rail and the mobile drawer.
 */
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
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
        <div className="border-t border-neutral-200 p-3">
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
        className: 'bg-white text-neutral-900 hover:bg-white',
      }}
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <HugeiconsIcon
            icon={item.icon}
            strokeWidth={2}
            className={
              isActive
                ? 'size-5 shrink-0 text-brand-600'
                : 'size-5 shrink-0 text-neutral-500 group-hover:text-neutral-700'
            }
          />
          {item.label}
        </>
      )}
    </Link>
  )
}
