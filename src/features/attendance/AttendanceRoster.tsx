import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MembershipBadge } from '@/features/people/MembershipBadge'
import { CheckIcon, CloseIcon, HugeiconsIcon, SearchIcon } from '@/lib/icons'
import { cn, displayName, initials } from '@/lib/utils'
import {
  membershipStatusLabels,
  membershipStatusValues,
  type MembershipStatus,
} from '@/domain/enums'
import type { Person } from '@/domain/person'

/*
 * The attendance register: a tally-from-the-roster surface, not a data grid.
 *
 * Design notes, because these are deliberate rather than incidental:
 *  - The whole row is the hit target (56px tall), so this works one-handed on a
 *    phone. A 16px checkbox is the wrong control for a task done standing up.
 *  - Present is a filled state on the row itself, not a tick in a column — you
 *    can see who is marked from arm's length while scrolling fast.
 *  - Rows are grouped by surname initial with a sticky A–Z rail, so a 200-person
 *    roster is two taps away from any name. No pagination: paging through a
 *    register loses your place.
 *  - Every tap saves immediately (see useTogglePresent). There is no Save button
 *    and therefore no way to lose a session's work.
 */

export type StatusFilter = MembershipStatus | 'ALL'

export interface AttendanceRosterProps {
  people: Person[]
  presentIds: Set<string>
  isLoading?: boolean
  canWrite?: boolean
  /** Marks/unmarks one person. Saved immediately by the caller. */
  onToggle: (personId: string, present: boolean) => void
  /** Marks every currently-visible person present (respects search + filter). */
  onMarkVisible: (personIds: string[]) => void
  /** Toolbar slot for the bulk-action menu. */
  actions?: React.ReactNode
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')

/** Group key for a person — surname initial, non-letters bucketed under '#'. */
function letterOf(person: Person) {
  const c = (person.lastName || person.firstName || '#').charAt(0).toUpperCase()
  return /[A-Z]/.test(c) ? c : '#'
}

export function AttendanceRoster({
  people,
  presentIds,
  isLoading,
  canWrite = true,
  onToggle,
  onMarkVisible,
  actions,
}: AttendanceRosterProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [onlyUnmarked, setOnlyUnmarked] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return people.filter((p) => {
      if (status !== 'ALL' && p.membershipStatus !== status) return false
      if (onlyUnmarked && presentIds.has(p.id)) return false
      if (!q) return true
      return [displayName(p), p.preferredName, p.email, p.phone]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    })
  }, [people, search, status, onlyUnmarked, presentIds])

  // Sections are derived from the *visible* set so the A–Z rail only offers
  // letters that actually exist right now.
  const sections = useMemo(() => {
    const map = new Map<string, Person[]>()
    for (const p of visible) {
      const key = letterOf(p)
      const list = map.get(key)
      if (list) list.push(p)
      else map.set(key, [p])
    }
    return [...map.entries()].sort(([a], [b]) =>
      a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b),
    )
  }, [visible])

  const available = new Set(sections.map(([letter]) => letter))
  const visibleUnmarked = visible.filter((p) => !presentIds.has(p.id))
  const filtering = Boolean(search.trim()) || status !== 'ALL' || onlyUnmarked

  function jumpTo(letter: string) {
    const el = scrollRef.current?.querySelector(`[data-letter="${letter}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <HugeiconsIcon
              icon={SearchIcon}
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the roster"
              aria-label="Search the roster"
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

          <div className="flex items-center gap-2 sm:ml-auto">
            <Select
              value={status}
              onValueChange={(v) => setStatus((v as StatusFilter) ?? 'ALL')}
            >
              <SelectTrigger className="w-40">
                <SelectValue>
                  {(v: string | null) =>
                    v && v !== 'ALL'
                      ? membershipStatusLabels[v as MembershipStatus]
                      : 'All statuses'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="ALL">All statuses</SelectItem>
                {membershipStatusValues.map((s) => (
                  <SelectItem key={s} value={s}>
                    {membershipStatusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {actions}
          </div>
        </div>

        {/* Second row: quick scoping + a bulk action that respects the filter. */}
        {canWrite ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyUnmarked((v) => !v)}
              aria-pressed={onlyUnmarked}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                onlyUnmarked
                  ? 'bg-brand-600 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              Not yet marked ({people.length - presentIds.size})
            </button>
            {visibleUnmarked.length > 0 ? (
              <Button
                variant="outline"
                onClick={() => onMarkVisible(visibleUnmarked.map((p) => p.id))}
              >
                <HugeiconsIcon icon={CheckIcon} />
                Mark {filtering ? 'these' : 'all'} {visibleUnmarked.length}{' '}
                present
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Roster */}
      <div className="relative flex">
        <div
          ref={scrollRef}
          className="max-h-[60vh] min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {isLoading ? (
            <RosterSkeleton />
          ) : visible.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                No one matches
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? `Nothing in the roster matches “${search}”.`
                  : 'Try a different filter.'}
              </p>
            </div>
          ) : (
            sections.map(([letter, group]) => (
              <section key={letter} data-letter={letter}>
                <h3 className="sticky top-0 z-10 bg-muted/80 px-4 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
                  {letter}
                </h3>
                <ul>
                  {group.map((person) => (
                    <RosterRow
                      key={person.id}
                      person={person}
                      present={presentIds.has(person.id)}
                      disabled={!canWrite}
                      onToggle={onToggle}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        {/* A–Z rail. Hidden on very small screens where the thumb covers it. */}
        {!isLoading && sections.length > 1 ? (
          <nav
            aria-label="Jump to letter"
            className="hidden shrink-0 flex-col justify-center gap-px border-l border-border px-1 py-2 sm:flex"
          >
            {LETTERS.map((letter) => {
              const enabled = available.has(letter)
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={!enabled}
                  onClick={() => jumpTo(letter)}
                  className={cn(
                    'flex h-4 w-5 items-center justify-center rounded text-[10px] leading-none font-medium transition-colors',
                    enabled
                      ? 'text-muted-foreground hover:bg-brand-50 hover:text-brand-700'
                      : 'text-muted-foreground/25',
                  )}
                >
                  {letter}
                </button>
              )
            })}
          </nav>
        ) : null}
      </div>
    </div>
  )
}

/*
 * One roster row. The <button> spans the full row so the target is the whole
 * 56px strip rather than a checkbox, and `aria-pressed` gives assistive tech the
 * same toggle semantics the visual state implies.
 */
function RosterRow({
  person,
  present,
  disabled,
  onToggle,
}: {
  person: Person
  present: boolean
  disabled?: boolean
  onToggle: (personId: string, present: boolean) => void
}) {
  return (
    <li className="border-b border-border/60 last:border-0">
      <button
        type="button"
        disabled={disabled}
        aria-pressed={present}
        onClick={() => onToggle(person.id, !present)}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring',
          present ? 'bg-brand-50/70 hover:bg-brand-50' : 'hover:bg-muted/50',
          disabled && 'cursor-default',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors',
            present
              ? 'bg-brand-600 text-white'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {present ? (
            <HugeiconsIcon icon={CheckIcon} className="size-4.5" />
          ) : (
            initials(person.firstName, person.lastName)
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block truncate text-sm',
              present
                ? 'font-semibold text-brand-900'
                : 'font-medium text-foreground',
            )}
          >
            {displayName(person)}
          </span>
          {person.phone ? (
            <span className="block truncate text-xs text-muted-foreground">
              {person.phone}
            </span>
          ) : null}
        </span>

        <MembershipBadge status={person.membershipStatus} />

        {/* Trailing state pip — reads as "marked" from a distance. */}
        <span
          aria-hidden
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            present
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-input',
          )}
        >
          {present ? (
            <HugeiconsIcon icon={CheckIcon} className="size-3" />
          ) : null}
        </span>
      </button>
    </li>
  )
}

function RosterSkeleton() {
  return (
    <ul>
      {Array.from({ length: 8 }, (_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5 last:border-0"
        >
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="size-5 rounded-full" />
        </li>
      ))}
    </ul>
  )
}
