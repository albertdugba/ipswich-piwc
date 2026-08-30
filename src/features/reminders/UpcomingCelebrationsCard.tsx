import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePeople } from '@/features/people/queries'
import {
  AnniversaryIcon,
  BirthdayIcon,
  HugeiconsIcon,
  MembersIcon,
} from '@/lib/icons'
import {
  relativeDayLabel,
  todayIso,
  upcomingCelebrations,
  type CelebrationKind,
} from '@/domain/celebration'
import { celebrationTitle } from './messages'
import { cn } from '@/lib/utils'
import type { IconSvgElement } from '@/lib/icons'

const kindIcon: Record<CelebrationKind, IconSvgElement> = {
  BIRTHDAY: BirthdayIcon,
  MARRIAGE_ANNIVERSARY: AnniversaryIcon,
  MEMBERSHIP_ANNIVERSARY: MembersIcon,
}

export function UpcomingCelebrationsCard({
  windowDays = 7,
  limit = 6,
}: {
  windowDays?: number
  limit?: number
}) {
  const peopleQuery = usePeople()
  const today = useMemo(() => todayIso(), [])

  const celebrations = useMemo(
    () =>
      upcomingCelebrations(peopleQuery.data ?? [], {
        fromIso: today,
        windowDays,
      }),
    [peopleQuery.data, today, windowDays],
  )

  const shown = celebrations.slice(0, limit)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b">
        <CardTitle>Upcoming celebrations</CardTitle>
        <Link
          to="/reminders"
          className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {peopleQuery.isLoading ? (
          <ul className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex items-center gap-3">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-3.5 w-48" />
              </li>
            ))}
          </ul>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing in the next {windowDays} days.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {shown.map((c) => (
              <li
                key={`${c.person.id}-${c.kind}-${c.occursOn}`}
                className="flex items-center gap-3"
              >
                <HugeiconsIcon
                  icon={kindIcon[c.kind]}
                  className={cn(
                    'size-4 shrink-0',
                    c.daysUntil === 0
                      ? 'text-brand-600'
                      : 'text-muted-foreground',
                  )}
                />
                <Link
                  to="/people/$personId"
                  params={{ personId: c.person.id }}
                  className="min-w-0 flex-1 truncate text-sm text-foreground hover:underline"
                >
                  {celebrationTitle(c)}
                </Link>
                {c.isMilestone ? (
                  <Badge className="bg-gold-100 text-gold-700">Milestone</Badge>
                ) : null}
                <span
                  className={cn(
                    'shrink-0 text-xs',
                    c.daysUntil === 0
                      ? 'font-medium text-brand-700'
                      : 'text-muted-foreground',
                  )}
                >
                  {relativeDayLabel(c.daysUntil)}
                </span>
              </li>
            ))}
            {celebrations.length > shown.length ? (
              <li className="pt-1 text-xs text-muted-foreground">
                +{celebrations.length - shown.length} more
              </li>
            ) : null}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
