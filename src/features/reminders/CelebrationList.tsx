import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AnniversaryIcon,
  BirthdayIcon,
  CheckIcon,
  HugeiconsIcon,
  MembersIcon,
  PhoneIcon,
} from '@/lib/icons'
import {
  celebrationId,
  canSms,
  relativeDayLabel,
  type Celebration,
  type CelebrationKind,
} from '@/domain/celebration'
import { celebrationTitle, greetingText, smsHref } from './messages'
import { cn, formatDate, initials } from '@/lib/utils'
import type { IconSvgElement } from '@/lib/icons'

const kindIcon: Record<CelebrationKind, IconSvgElement> = {
  BIRTHDAY: BirthdayIcon,
  MARRIAGE_ANNIVERSARY: AnniversaryIcon,
  MEMBERSHIP_ANNIVERSARY: MembersIcon,
}

const kindTone: Record<CelebrationKind, string> = {
  BIRTHDAY: 'bg-gold-50 text-gold-700',
  MARRIAGE_ANNIVERSARY: 'bg-flame-50 text-flame-700',
  MEMBERSHIP_ANNIVERSARY: 'bg-brand-50 text-brand-700',
}

export function CelebrationList({
  celebrations,
  greetedIds,
  smsSentIds,
  isLoading,
  canWrite,
  onToggleGreeted,
  emptyLabel = 'Nothing coming up in this window.',
}: {
  celebrations: Celebration[]
  greetedIds: Set<string>
  smsSentIds?: Set<string>
  isLoading?: boolean
  canWrite?: boolean
  onToggleGreeted: (c: Celebration, greeted: boolean) => void
  emptyLabel?: string
}) {
  if (isLoading) return <ListSkeleton />

  if (celebrations.length === 0) {
    return (
      <div className="rounded-xl bg-card px-4 py-14 text-center shadow-sm ring-1 ring-foreground/10">
        <p className="text-sm font-medium text-foreground">All quiet</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <ul className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      {celebrations.map((c) => {
        const id = celebrationId(c)
        const greeted = greetedIds.has(id)
        const autoTexted = smsSentIds?.has(id) ?? false
        const message = greetingText(c)
        const href = smsHref(c.person.phone, message)
        const sendable = canSms(c.person)

        return (
          <li
            key={id}
            className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0"
          >
            <span
              aria-hidden
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                greeted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {greeted ? (
                <HugeiconsIcon icon={CheckIcon} className="size-5" />
              ) : (
                initials(c.person.firstName, c.person.lastName)
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {celebrationTitle(c)}
                </p>
                {c.isMilestone ? (
                  <Badge className="bg-gold-100 text-gold-700">Milestone</Badge>
                ) : null}
              </div>
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 font-medium',
                    kindTone[c.kind],
                  )}
                >
                  <HugeiconsIcon
                    icon={kindIcon[c.kind]}
                    className="mr-1 inline size-3"
                  />
                  {relativeDayLabel(c.daysUntil)}
                </span>
                <span>{formatDate(c.occursOn)}</span>
                {autoTexted ? (
                  <span className="font-medium text-emerald-700">
                    Texted automatically
                  </span>
                ) : !sendable ? (
                  <span className="text-muted-foreground/70">
                    {c.person.smsOptOut
                      ? 'Opted out of texts'
                      : 'No phone number'}
                  </span>
                ) : null}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {sendable && href ? (
                <Button
                  render={<a href={href} />}
                  variant="outline"
                  aria-label={`Text ${c.person.firstName}`}
                >
                  <HugeiconsIcon icon={PhoneIcon} />
                  Text
                </Button>
              ) : null}
              {canWrite ? (
                <Button
                  variant={greeted ? 'secondary' : 'default'}
                  onClick={() => onToggleGreeted(c, !greeted)}
                >
                  {greeted ? 'Greeted' : 'Mark greeted'}
                </Button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ListSkeleton() {
  return (
    <ul className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      {Array.from({ length: 5 }, (_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0"
        >
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-52" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </li>
      ))}
    </ul>
  )
}
