import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { HugeiconsIcon, MoreIcon } from '@/lib/icons'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { NAV_ITEMS, type NavItem } from '@/lib/navigation'
import { hasPermission } from '@/lib/auth/permissions'
import { cn } from '@/lib/utils'
import type { AuthUser } from '@/lib/auth/session'
import { SidebarNav } from './Sidebar'

// Primary destinations pinned to the tab bar, in order. Everything else lives
// behind "More".
const PRIMARY_TABS = ['/dashboard', '/people', '/attendance', '/contributions']

export function MobileTabBar({ user }: { user: AuthUser }) {
  const [moreOpen, setMoreOpen] = useState(false)

  const permitted = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(user.role, item.permission),
  )
  const tabs = PRIMARY_TABS.map((to) =>
    permitted.find((i) => i.to === to),
  ).filter((i): i is NavItem => Boolean(i))

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-lg md:hidden"
      // Sit nearly flush with the bottom: keep only a small clearance for the
      // home indicator instead of the full inset, which left too big a gap.
      style={{
        paddingBottom: 'max(0.375rem, calc(env(safe-area-inset-bottom) - 1.5rem))',
      }}
    >
      <div className="flex h-14 items-stretch">
        {tabs.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === '/people' }}
            className="group flex flex-1 flex-col items-center justify-center gap-1 text-neutral-500"
            activeProps={{ className: 'text-brand-600' }}
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <span
                  className={cn(
                    'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                    isActive && 'bg-brand-50',
                  )}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className="size-6"
                  />
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </Link>
        ))}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger
            aria-label="More"
            className="group flex flex-1 flex-col items-center justify-center gap-1 text-neutral-500 data-[state=open]:text-brand-600"
          >
            <span className="flex h-7 w-12 items-center justify-center rounded-full transition-colors group-data-[state=open]:bg-brand-50">
              <HugeiconsIcon
                icon={MoreIcon}
                strokeWidth={1.8}
                className="size-6"
              />
            </span>
            <span className="text-[10px] font-medium">More</span>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 max-w-[85vw] bg-neutral-100 p-0"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarNav user={user} onNavigate={() => setMoreOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
