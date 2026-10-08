import type * as React from 'react'
import {
  ArrowDownRight01Icon,
  ArrowUpRight01Icon,
  HugeiconsIcon,
  type IconSvgElement,
} from '@/lib/icons'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon,
  hint,
  trend,
  chart,
}: {
  label: string
  value: string | number
  icon?: IconSvgElement
  hint?: string
  trend?: number
  chart?: React.ReactNode
}) {
  const hasTrend = typeof trend === 'number'
  const up = (trend ?? 0) >= 0

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-card p-3.5 text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs leading-snug font-medium text-muted-foreground sm:text-sm">
          {label}
        </span>
        {icon ? (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 sm:size-8">
            <HugeiconsIcon icon={icon} className="size-3.5 sm:size-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-2 sm:pt-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {value}
            </span>
            {hasTrend ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  up ? 'text-emerald-600' : 'text-red-600',
                )}
              >
                <HugeiconsIcon
                  icon={up ? ArrowUpRight01Icon : ArrowDownRight01Icon}
                  className="size-3"
                />
                {Math.abs(trend ?? 0)}%
              </span>
            ) : null}
          </div>
          {hint ? (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:mt-1 sm:text-xs">
              {hint}
            </p>
          ) : null}
        </div>
        {chart ? <div className="hidden shrink-0 sm:block">{chart}</div> : null}
      </div>
    </div>
  )
}
