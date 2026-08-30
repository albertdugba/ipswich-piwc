import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsCount, TabsList, TabsTab } from '@/components/ui/tabs'
import {
  AddIcon,
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  HugeiconsIcon,
  SearchIcon,
} from '@/lib/icons'
import { paymentMethodLabels } from '@/domain/enums'
import { penceToPounds, type ContributionRecord } from '@/domain/contribution'
import { cn, displayName, formatDate, formatGBP, initials } from '@/lib/utils'
import type { Person } from '@/domain/person'

/*
 * Who has contributed to a fund — and, when the fund sets an expected amount,
 * who still owes. This is the chasing surface: the default filter is "unpaid",
 * because the useful question is almost never "who paid?" but "who hasn't?".
 *
 * A person can appear with several payments (instalments), so each row shows
 * their running total and expands to the individual records.
 */

type PayState = 'PAID' | 'PART' | 'UNPAID'
type Filter = 'ALL' | PayState

export interface ContributorRosterProps {
  people: Person[]
  records: ContributionRecord[]
  /** personId → total given, in pence. */
  givenByPerson: Map<string, number>
  /** Pence expected from each person, or null when the fund has no target. */
  expectedPerPerson: number | null
  canSeeAmounts?: boolean
  canWrite?: boolean
  isLoading?: boolean
  onRecordFor: (person: Person) => void
  onDeleteRecord: (recordId: string) => void
}

function stateOf(given: number, expected: number | null): PayState {
  if (expected && expected > 0) {
    if (given >= expected) return 'PAID'
    return given > 0 ? 'PART' : 'UNPAID'
  }
  return given > 0 ? 'PAID' : 'UNPAID'
}

const stateTone: Record<PayState, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PART: 'bg-gold-50 text-gold-700',
  UNPAID: 'bg-muted text-muted-foreground',
}

export function ContributorRoster({
  people,
  records,
  givenByPerson,
  expectedPerPerson,
  canSeeAmounts = true,
  canWrite = true,
  isLoading,
  onRecordFor,
  onDeleteRecord,
}: ContributorRosterProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [expanded, setExpanded] = useState<string | null>(null)

  const tracksDues = Boolean(expectedPerPerson && expectedPerPerson > 0)

  const recordsByPerson = useMemo(() => {
    const map = new Map<string, ContributionRecord[]>()
    for (const r of records) {
      const list = map.get(r.personId)
      if (list) list.push(r)
      else map.set(r.personId, [r])
    }
    return map
  }, [records])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return people
      .map((person) => {
        const given = givenByPerson.get(person.id) ?? 0
        return { person, given, state: stateOf(given, expectedPerPerson) }
      })
      .filter((r) => {
        if (filter !== 'ALL' && r.state !== filter) return false
        if (!q) return true
        return displayName(r.person).toLowerCase().includes(q)
      })
      .sort(
        (a, b) =>
          b.given - a.given ||
          displayName(a.person).localeCompare(displayName(b.person)),
      )
  }, [people, givenByPerson, expectedPerPerson, filter, search])

  const counts = useMemo(() => {
    const c = { PAID: 0, PART: 0, UNPAID: 0 }
    for (const p of people) {
      c[stateOf(givenByPerson.get(p.id) ?? 0, expectedPerPerson)] += 1
    }
    return c
  }, [people, givenByPerson, expectedPerPerson])

  const tabs: { value: Filter; label: string; count: number }[] = [
    { value: 'ALL', label: 'Everyone', count: people.length },
    {
      value: 'PAID',
      label: tracksDues ? 'Paid' : 'Given',
      count: counts.PAID,
    },
    // Part-paid only makes sense when the fund sets an expected amount.
    ...(tracksDues
      ? [{ value: 'PART' as Filter, label: 'Part-paid', count: counts.PART }]
      : []),
    {
      value: 'UNPAID',
      label: tracksDues ? 'Unpaid' : 'Not yet',
      count: counts.UNPAID,
    },
  ]

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex flex-col gap-3 border-b border-border p-3">
        <div className="relative w-full sm:max-w-xs">
          <HugeiconsIcon
            icon={SearchIcon}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people"
            aria-label="Search people"
            className={cn('pl-9', search && 'pr-9')}
          />
          {search ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <HugeiconsIcon icon={CloseIcon} className="size-3.5" />
            </button>
          ) : null}
        </div>

        <Tabs
          value={filter}
          onValueChange={(v) => setFilter((v as Filter) ?? 'ALL')}
        >
          <TabsList aria-label="Filter by payment state">
            {tabs.map((tab) => (
              <TabsTab key={tab.value} value={tab.value}>
                {tab.label}
                <TabsCount>{tab.count}</TabsCount>
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <RosterSkeleton />
      ) : rows.length === 0 ? (
        <div className="px-4 py-14 text-center">
          <p className="text-sm font-medium text-foreground">No one to show</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? `Nothing matches “${search}”.`
              : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <ul>
          {rows.map(({ person, given, state }) => {
            const personRecords = recordsByPerson.get(person.id) ?? []
            const isOpen = expanded === person.id
            return (
              <li
                key={person.id}
                className="border-b border-border/60 last:border-0"
              >
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                      state === 'PAID'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {state === 'PAID' ? (
                      <HugeiconsIcon icon={CheckIcon} className="size-4.5" />
                    ) : (
                      initials(person.firstName, person.lastName)
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {displayName(person)}
                    </p>
                    {personRecords.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : person.id)}
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                      >
                        {personRecords.length}{' '}
                        {personRecords.length === 1 ? 'payment' : 'payments'}
                      </button>
                    ) : null}
                  </div>

                  {canSeeAmounts && given > 0 ? (
                    <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                      {formatGBP(penceToPounds(given))}
                    </span>
                  ) : null}

                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                      stateTone[state],
                    )}
                  >
                    {state === 'PAID'
                      ? tracksDues
                        ? 'Paid'
                        : 'Given'
                      : state === 'PART'
                        ? 'Part'
                        : tracksDues
                          ? 'Unpaid'
                          : '—'}
                  </span>

                  {canWrite ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Record a contribution for ${displayName(person)}`}
                      onClick={() => onRecordFor(person)}
                    >
                      <HugeiconsIcon icon={AddIcon} />
                    </Button>
                  ) : null}
                </div>

                {/* Individual payments, so an instalment can be corrected. */}
                {isOpen && personRecords.length > 0 ? (
                  <ul className="border-t border-border/60 bg-muted/30 px-4 py-2">
                    {personRecords.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center gap-3 py-1.5 text-xs"
                      >
                        <span className="text-muted-foreground">
                          {formatDate(r.contributedOn)}
                        </span>
                        <span className="text-muted-foreground">
                          {paymentMethodLabels[r.method]}
                        </span>
                        {r.note ? (
                          <span className="truncate text-muted-foreground/80">
                            {r.note}
                          </span>
                        ) : null}
                        {canSeeAmounts ? (
                          <span className="ml-auto font-medium text-foreground tabular-nums">
                            {formatGBP(penceToPounds(r.amount))}
                          </span>
                        ) : (
                          <span className="ml-auto" />
                        )}
                        {canWrite ? (
                          <button
                            type="button"
                            aria-label="Delete this payment"
                            onClick={() => onDeleteRecord(r.id)}
                            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <HugeiconsIcon
                              icon={DeleteIcon}
                              className="size-3.5"
                            />
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function RosterSkeleton() {
  return (
    <ul>
      {Array.from({ length: 6 }, (_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5 last:border-0"
        >
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-14" />
        </li>
      ))}
    </ul>
  )
}
