'use client'

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'

import { cn } from '@/lib/utils'

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-3', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  variant = 'segmented',
  children,
  ...props
}: TabsPrimitive.List.Props & { variant?: 'segmented' | 'underline' }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        'relative isolate flex items-center',
        variant === 'segmented'
          ? 'w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-muted p-1'
          : 'gap-1 overflow-x-auto border-b border-border',
        className,
      )}
      {...props}
    >
      {children}
      <TabsIndicator variant={variant} />
    </TabsPrimitive.List>
  )
}

function TabsIndicator({
  className,
  variant = 'segmented',
  ...props
}: TabsPrimitive.Indicator.Props & { variant?: 'segmented' | 'underline' }) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      renderBeforeHydration
      className={cn(
        'absolute left-0 -z-10 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] transition-all duration-200 ease-out',
        variant === 'segmented'
          ? 'top-[var(--active-tab-top)] h-[var(--active-tab-height)] rounded-full bg-brand-600 shadow-sm'
          : 'bottom-0 h-0.5 rounded-full bg-brand-600',
        className,
      )}
      {...props}
    />
  )
}

function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(
        'group/tab relative flex shrink-0 cursor-default items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors select-none',
        'hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
        'aria-selected:text-white',
        'in-data-[variant=underline]:rounded-none in-data-[variant=underline]:px-3 in-data-[variant=underline]:pb-2.5 in-data-[variant=underline]:aria-selected:text-brand-700',
        className,
      )}
      {...props}
    />
  )
}

function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn('outline-none', className)}
      {...props}
    />
  )
}

function TabsCount({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="tabs-count"
      className={cn(
        'rounded-full bg-foreground/8 px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums transition-colors',
        'group-aria-selected/tab:bg-white/20 group-aria-selected/tab:text-white',
        className,
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTab, TabsPanel, TabsIndicator, TabsCount }
