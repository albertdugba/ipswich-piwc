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
    <div className="group relative overflow-hidden rounded-xl bg-card p-5 text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        {icon ? (
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <HugeiconsIcon icon={icon} className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
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
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {chart ? <div className="shrink-0">{chart}</div> : null}
      </div>
    </div>
  )
}
