import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label
        htmlFor={htmlFor}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function FieldGrid({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      {children}
    </div>
  )
}
