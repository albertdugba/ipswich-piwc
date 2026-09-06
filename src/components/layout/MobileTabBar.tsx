import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
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

// iOS-style ease-out — the pill decelerates as it settles under the tab.
const SLIDE_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'

export function MobileTabBar({ user }: { user: AuthUser }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const permitted = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(user.role, item.permission),
  )
  const tabs = PRIMARY_TABS.map((to) =>
    permitted.find((i) => i.to === to),
  ).filter((i): i is NavItem => Boolean(i))

  // +1 for the "More" column. The sliding pill only tracks route tabs.
  const columnCount = tabs.length + 1
  const activeIndex = tabs.findIndex((t) => pathname.startsWith(t.to))

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-lg md:hidden"
      // Sit nearly flush: drop most of the home-indicator inset, keep a hair of
      // clearance so labels never touch the indicator line.
      style={{
        paddingBottom: 'max(0.25rem, calc(env(safe-area-inset-bottom) - 2rem))',
      }}
    >
      <div className="relative flex h-14 items-stretch">
        {/* Sliding active pill — glides between tabs behind the active icon. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1 left-0 h-8 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-opacity"
          style={{
            width: `${100 / columnCount}%`,
            transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
            opacity: activeIndex < 0 ? 0 : 1,
            transitionTimingFunction: SLIDE_EASE,
          }}
        >
          <span className="mx-auto block h-8 w-14 rounded-full bg-brand-50" />
        </div>

        {tabs.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === '/people' }}
            className="group relative z-10 flex flex-1 flex-col items-center justify-center gap-1 text-neutral-500 transition-transform duration-100 ease-out active:scale-90"
            activeProps={{ className: 'text-brand-600' }}
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <span className="flex h-8 w-14 items-center justify-center">
                  <HugeiconsIcon
                    icon={item.icon}
                    strokeWidth={isActive ? 2.3 : 1.8}
                    className={cn(
                      'size-6 transition-transform duration-200 ease-out',
                      isActive &&
                        'motion-safe:-translate-y-px motion-safe:scale-110',
                    )}
                  />
                </span>
                <span className="text-[10px] font-medium transition-colors">
                  {item.label}
                </span>
              </>
            )}
          </Link>
        ))}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger
            aria-label="More"
            className="group relative z-10 flex flex-1 flex-col items-center justify-center gap-1 text-neutral-500 transition-transform duration-100 ease-out active:scale-90 data-[state=open]:text-brand-600"
          >
            <span className="flex h-8 w-14 items-center justify-center rounded-full transition-colors group-data-[state=open]:bg-brand-50">
              <HugeiconsIcon
                icon={MoreIcon}
                strokeWidth={1.8}
                className="size-6 transition-transform duration-200 ease-out group-data-[state=open]:motion-safe:scale-110"
              />
            </span>
            <span className="text-[10px] font-medium transition-colors">
              More
            </span>
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
