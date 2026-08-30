import type { ReactNode } from 'react'
import { AlertIcon, HugeiconsIcon, InboxIcon, SpinnerIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'

export function LoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground',
        className,
      )}
    >
      <HugeiconsIcon icon={SpinnerIcon} className="size-4 animate-spin" />
      {label}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/40 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="mb-3 text-muted-foreground">
        {icon ?? <HugeiconsIcon icon={InboxIcon} className="size-8" />}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
  className,
}: {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center',
        className,
      )}
    >
      <HugeiconsIcon
        icon={AlertIcon}
        className="mb-3 size-8 text-destructive"
      />
      <h3 className="text-sm font-semibold text-destructive">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-destructive/80">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
