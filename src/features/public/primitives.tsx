import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { RevealWords } from './motion'

/** Centered, padded content column shared by every public section. */
export function Container({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[96rem] px-5 sm:px-8 lg:px-12',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Vertical rhythm wrapper for a page section. */
export function Section({
  className,
  children,
  id,
}: {
  className?: string
  children: ReactNode
  id?: string
}) {
  return (
    <section id={id} className={cn('scroll-mt-20 py-20 sm:py-28', className)}>
      {children}
    </section>
  )
}

/** Section label — small, tracked, above a heading. */
export function Eyebrow({
  children,
  className,
  onDark,
}: {
  children: ReactNode
  className?: string
  onDark?: boolean
}) {
  return (
    <span
      className={cn(
        'type-eyebrow block',
        onDark ? 'text-gold-300' : 'text-brand-600',
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * Display heading for public sections — the serif, set light and large.
 * Plain-text headings rise in word by word as they scroll into view.
 */
export function DisplayHeading({
  children,
  className,
  as: Tag = 'h2',
}: {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3'
}) {
  const classes = cn('type-h2 text-ink', className)
  if (typeof children === 'string') {
    return <RevealWords as={Tag} text={children} className={classes} />
  }
  return <Tag className={classes}>{children}</Tag>
}
