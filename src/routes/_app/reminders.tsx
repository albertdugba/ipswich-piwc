import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth/route-guards'
import { hasPermission } from '@/lib/auth/permissions'
import { isFirebaseConfigured } from '@/lib/env.public'
import { usePeople } from '@/features/people/queries'
import { useGreetings, useSetGreeted } from '@/features/reminders/queries'
import { CelebrationList } from '@/features/reminders/CelebrationList'
import {
  Button,
  ErrorState,
  PageHeader,
  StatCard,
  Tabs,
  TabsCount,
  TabsList,
  TabsTab,
} from '@/components/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AnniversaryIcon, BirthdayIcon, MembersIcon } from '@/lib/icons'
import {
  celebrationId,
  celebrationKindValues,
  todayIso,
  upcomingCelebrations,
  type Celebration,
  type CelebrationKind,
} from '@/domain/celebration'
import type { Person } from '@/domain/person'

export const Route = createFileRoute('/_app/reminders')({
  beforeLoad: ({ context }) =>
    requirePermission(context.user, 'reminders:read'),
  component: RemindersPage,
})

const NO_PEOPLE: Person[] = []
type KindFilter = CelebrationKind | 'ALL'

const WINDOWS = [
  { value: '2', label: 'Next 2 days' },
  { value: '7', label: 'Next 7 days' },
  { value: '30', label: 'Next 30 days' },
] as const

function RemindersPage() {
  const { user } = Route.useRouteContext()
  const canWrite = hasPermission(user.role, 'people:write')

  const today = useMemo(() => todayIso(), [])
  const [windowDays, setWindowDays] = useState('7')
  const [kind, setKind] = useState<KindFilter>('ALL')

  const peopleQuery = usePeople()
  const greetingsQuery = useGreetings(today)
  const setGreeted = useSetGreeted(today)

  const people = peopleQuery.data ?? NO_PEOPLE

  const all = useMemo(
    () =>
      upcomingCelebrations(people, {
        fromIso: today,
        windowDays: Number(windowDays),
      }),
    [people, today, windowDays],
  )

  const greetedIds = useMemo(
    () => new Set((greetingsQuery.data ?? []).map((g) => g.id)),
    [greetingsQuery.data],
  )

  const counts = useMemo(() => {
    const c: Record<CelebrationKind, number> = {
      BIRTHDAY: 0,
      MARRIAGE_ANNIVERSARY: 0,
      MEMBERSHIP_ANNIVERSARY: 0,
    }
    for (const x of all) c[x.kind] += 1
    return c
  }, [all])

  const shown = kind === 'ALL' ? all : all.filter((c) => c.kind === kind)
  const todayCount = all.filter((c) => c.daysUntil === 0).length
  const outstanding = all.filter(
    (c) => !greetedIds.has(celebrationId(c)),
  ).length

  function toggleGreeted(c: Celebration, greeted: boolean) {
    setGreeted.mutate({
      id: celebrationId(c),
      personId: c.person.id,
      kind: c.kind,
      occursOn: c.occursOn,
      greeted,
      greetedById: user.id,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reminders"
        description="The software remembers what the church might forget."
        actions={
          <Select
            value={windowDays}
            onValueChange={(v) => setWindowDays((v as string) ?? '7')}
          >
            <SelectTrigger className="w-44">
              <SelectValue>
                {(v: string | null) =>
                  WINDOWS.find((w) => w.value === v)?.label ?? 'Next 7 days'
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {WINDOWS.map((w) => (
                <SelectItem key={w.value} value={w.value}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {!isFirebaseConfigured ? (
        <ErrorState
          title="Connect Firebase to see reminders"
          description="Set the VITE_FIREBASE_* variables in .env so member dates can be read."
        />
      ) : peopleQuery.isError ? (
        <ErrorState
          title="Couldn’t load members"
          action={
            <Button variant="outline" onClick={() => peopleQuery.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Today" value={todayCount} icon={BirthdayIcon} />
            <StatCard
              label="In this window"
              value={all.length}
              icon={AnniversaryIcon}
            />
            <StatCard
              label="Not yet greeted"
              value={outstanding}
              icon={MembersIcon}
              hint="Across everything shown."
            />
          </div>

          <Tabs
            value={kind}
            onValueChange={(v) => setKind((v as KindFilter) ?? 'ALL')}
          >
            <TabsList aria-label="Filter by celebration">
              <TabsTab value="ALL">
                Everything
                <TabsCount>{all.length}</TabsCount>
              </TabsTab>
              {celebrationKindValues.map((k) => (
                <TabsTab key={k} value={k}>
                  {k === 'BIRTHDAY'
                    ? 'Birthdays'
                    : k === 'MARRIAGE_ANNIVERSARY'
                      ? 'Anniversaries'
                      : 'Membership'}
                  <TabsCount>{counts[k]}</TabsCount>
                </TabsTab>
              ))}
            </TabsList>
          </Tabs>

          <CelebrationList
            celebrations={shown}
            greetedIds={greetedIds}
            isLoading={peopleQuery.isLoading || greetingsQuery.isLoading}
            canWrite={canWrite}
            onToggleGreeted={toggleGreeted}
          />
        </>
      )}
    </div>
  )
}
