import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ActivityCalendarIcon,
  AlertIcon,
  ArrowDownRight01Icon,
  ArrowUpRight01Icon,
  AttendanceIcon,
  BirthdayIcon,
  CheckIcon,
  ChevronRightIcon,
  HugeiconsIcon,
  PhoneIcon,
  PrayerIcon,
  TestimonyIcon,
  UserIcon,
  VisitorIcon,
  type IconSvgElement,
} from '@/lib/icons'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { PersonFormDialog } from '@/features/people/PersonFormDialog'
import { ServiceFormDialog } from '@/features/attendance/ServiceFormDialog'
import { hasPermission } from '@/lib/auth/permissions'
import { isFirebaseConfigured } from '@/lib/env.public'
import { cn, initials } from '@/lib/utils'
import type { AuthUser } from '@/lib/auth/session'
import { AreaChart, BarChart, RankedBars, type ChartPoint } from './charts'
import type { DashboardSummary } from './mock-data'

function TrendBadge({
  value,
  suffix = '',
  className,
}: {
  value: number
  suffix?: string
  className?: string
}) {
  const up = value >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
        className,
      )}
    >
      <HugeiconsIcon
        icon={up ? ArrowUpRight01Icon : ArrowDownRight01Icon}
        className="size-3.5"
      />
      {up ? '+' : ''}
      {value}
      {suffix}
    </span>
  )
}

function greetingFor(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Brand-coloured welcome band. Leads with the one number leaders ask about
 * first — how many came to the last service.
 */
export function DashboardHero({
  user,
  attendance,
}: {
  user: AuthUser
  attendance: DashboardSummary['attendance']
}) {
  const now = new Date()
  const firstName = user.displayName.split(' ')[0]
  const dateLabel = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const up = attendance.trendPct >= 0

  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-600 via-brand-700 to-brand-900 p-5 text-white shadow-sm sm:p-7">
      {/* Soft gold glow, echoing the logo's banner. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-gold-400/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-10 size-56 rounded-full bg-brand-400/30 blur-3xl"
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="text-xs font-medium tracking-wide text-white/70 uppercase"
            suppressHydrationWarning
          >
            {dateLabel}
          </p>
          <h1
            className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl"
            suppressHydrationWarning
          >
            {greetingFor(now.getHours())}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-white/75">
            Here’s what’s happening at Ipswich PIWC.
          </p>
        </div>

        <Link
          to="/attendance"
          className="group flex items-center gap-4 rounded-xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/15 sm:min-w-64"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-white/70">
              {attendance.latestServiceName} · {attendance.latestServiceDate}
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                {attendance.latestCount}
              </span>
              <span className="text-sm text-white/75">attended</span>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
              <HugeiconsIcon
                icon={up ? ArrowUpRight01Icon : ArrowDownRight01Icon}
                className={cn(
                  'size-3.5',
                  up ? 'text-emerald-300' : 'text-red-300',
                )}
              />
              <span
                className={cn(
                  'font-semibold',
                  up ? 'text-emerald-300' : 'text-red-300',
                )}
              >
                {up ? '+' : ''}
                {attendance.trendPct}%
              </span>
              vs average of {attendance.average}
            </p>
          </div>
          <HugeiconsIcon
            icon={ChevronRightIcon}
            className="size-5 shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </section>
  )
}

const actionTileClass =
  'group flex flex-col items-center gap-2 rounded-xl p-1 text-center transition-colors sm:flex-row sm:items-center sm:gap-3 sm:bg-card sm:p-3 sm:text-left sm:ring-1 sm:ring-foreground/10 sm:hover:ring-brand-200'

function ActionTileBody({
  icon,
  label,
  hint,
  tone,
}: {
  icon: IconSvgElement
  label: string
  hint: string
  tone: string
}) {
  return (
    <>
      <span
        className={cn(
          'flex size-13 items-center justify-center rounded-2xl ring-1 ring-foreground/5 transition-transform group-active:scale-95 sm:size-10 sm:rounded-xl',
          tone,
        )}
      >
        <HugeiconsIcon icon={icon} className="size-6 sm:size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs leading-tight font-medium whitespace-nowrap text-foreground sm:text-sm">
          {label}
        </span>
        <span className="hidden truncate text-xs text-muted-foreground sm:block">
          {hint}
        </span>
      </span>
    </>
  )
}

/**
 * The jobs people open the app to do, one tap away. App-style icon tiles on
 * phones; compact cards from `sm` up.
 */
export function QuickActions({ user }: { user: AuthUser }) {
  const navigate = useNavigate()
  const [addingPerson, setAddingPerson] = useState(false)
  const [addingService, setAddingService] = useState(false)

  const canAddPerson =
    isFirebaseConfigured && hasPermission(user.role, 'people:write')
  const canAddService =
    isFirebaseConfigured && hasPermission(user.role, 'attendance:write')

  return (
    <>
      <nav
        aria-label="Quick actions"
        className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-4"
      >
        {canAddPerson ? (
          <button
            type="button"
            onClick={() => setAddingPerson(true)}
            className={actionTileClass}
          >
            <ActionTileBody
              icon={VisitorIcon}
              label="Add member"
              hint="New member or visitor"
              tone="bg-brand-50 text-brand-600"
            />
          </button>
        ) : (
          <Link to="/people" className={actionTileClass}>
            <ActionTileBody
              icon={VisitorIcon}
              label="Members"
              hint="Browse the directory"
              tone="bg-brand-50 text-brand-600"
            />
          </Link>
        )}

        {canAddService ? (
          <button
            type="button"
            onClick={() => setAddingService(true)}
            className={actionTileClass}
          >
            <ActionTileBody
              icon={AttendanceIcon}
              label="Attendance"
              hint="Record a service"
              tone="bg-emerald-50 text-emerald-600"
            />
          </button>
        ) : (
          <Link to="/attendance" className={actionTileClass}>
            <ActionTileBody
              icon={AttendanceIcon}
              label="Attendance"
              hint="Services & trends"
              tone="bg-emerald-50 text-emerald-600"
            />
          </Link>
        )}

        <Link to="/prayer-requests" className={actionTileClass}>
          <ActionTileBody
            icon={PrayerIcon}
            label="Prayer"
            hint="Requests to pray over"
            tone="bg-sky-50 text-sky-600"
          />
        </Link>

        <Link to="/reminders" className={actionTileClass}>
          <ActionTileBody
            icon={BirthdayIcon}
            label="Celebrations"
            hint="Birthdays & anniversaries"
            tone="bg-gold-100 text-gold-700"
          />
        </Link>
      </nav>

      {canAddPerson ? (
        <PersonFormDialog
          open={addingPerson}
          onOpenChange={setAddingPerson}
          onCreated={(id) =>
            navigate({ to: '/people/$personId', params: { personId: id } })
          }
        />
      ) : null}
      {canAddService ? (
        <ServiceFormDialog
          open={addingService}
          onOpenChange={setAddingService}
          onCreated={(id) =>
            navigate({
              to: '/attendance/$serviceId',
              params: { serviceId: id },
            })
          }
        />
      ) : null}
    </>
  )
}

function CardLink({
  to,
  children,
}: {
  to: '/attendance' | '/ministries'
  children: string
}) {
  return (
    <CardAction>
      <Link
        to={to}
        className="-my-1 inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
      >
        {children}
        <HugeiconsIcon icon={ChevronRightIcon} className="size-3.5" />
      </Link>
    </CardAction>
  )
}

export function AttendanceTrendCard({
  data,
}: {
  data: DashboardSummary['attendance']
}) {
  const points: ChartPoint[] = data.weekly.map((w) => ({
    label: w.label,
    value: w.count,
  }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
        <CardDescription>
          Last {data.weekly.length} services · avg {data.average}
        </CardDescription>
        <CardLink to="/attendance">View all</CardLink>
      </CardHeader>
      <CardContent>
        <BarChart
          data={points}
          average={data.average}
          ariaLabel={`Attendance over the last ${data.weekly.length} services`}
        />
      </CardContent>
    </Card>
  )
}

export function MembershipGrowthCard({
  data,
}: {
  data: DashboardSummary['membershipGrowth']
}) {
  const months = data.monthly
  const first = months[0]
  const last = months[months.length - 1]
  if (!first || !last) return null
  const growth = last.total - first.total
  const growthPct = first.total ? Math.round((growth / first.total) * 100) : 0
  const totalJoined = months.reduce((sum, m) => sum + m.joined, 0)
  const points: ChartPoint[] = months.map((m) => ({
    label: m.label,
    value: m.total,
  }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership growth</CardTitle>
        <CardDescription>Last {months.length} months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {last.total}
          </span>
          <TrendBadge value={growth} />
          <span className="text-sm text-muted-foreground">
            {growthPct}% · {totalJoined} joined
          </span>
        </div>
        <div className="mt-2">
          <AreaChart
            data={points}
            ariaLabel={`Membership total over the last ${months.length} months`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export function NeedsAttentionCard({
  data,
}: {
  data: DashboardSummary['needsAttention']
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>People who shouldn’t slip through</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <AttentionTile
            to="/people"
            icon={VisitorIcon}
            tone="amber"
            label="Visitors to follow up"
            value={data.visitorsToFollowUp}
          />
          <AttentionTile
            to="/prayer-requests"
            icon={PrayerIcon}
            tone="sky"
            label="New prayer requests"
            value={data.newPrayerRequests}
          />
        </div>
        <AbsentMembersList members={data.absentMembers} />
      </CardContent>
    </Card>
  )
}

const TILE_TONES = {
  amber: {
    tile: 'bg-amber-50/70 ring-amber-100 hover:ring-amber-300',
    chip: 'bg-amber-100 text-amber-700',
  },
  sky: {
    tile: 'bg-sky-50/70 ring-sky-100 hover:ring-sky-300',
    chip: 'bg-sky-100 text-sky-700',
  },
} as const

function AttentionTile({
  to,
  icon,
  label,
  value,
  tone,
}: {
  to: '/people' | '/prayer-requests'
  icon: IconSvgElement
  label: string
  value: number
  tone: keyof typeof TILE_TONES
}) {
  const t = TILE_TONES[tone]
  return (
    <Link
      to={to}
      className={cn(
        'group flex flex-col gap-1.5 rounded-xl p-3 ring-1 transition-shadow active:scale-[0.98]',
        t.tile,
      )}
    >
      <span className="flex items-center justify-between">
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-lg',
            t.chip,
          )}
        >
          <HugeiconsIcon icon={icon} className="size-4" />
        </span>
        <HugeiconsIcon
          icon={ChevronRightIcon}
          className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      </span>
      <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </span>
      <span className="text-xs leading-snug font-medium text-muted-foreground">
        {label}
      </span>
    </Link>
  )
}

function AbsentMembersList({
  members,
}: {
  members: DashboardSummary['needsAttention']['absentMembers']
}) {
  const [contacted, setContacted] = useState<Record<string, boolean>>({})
  const remaining = members.filter((m) => !contacted[m.name]).length
  const allDone = remaining === 0 && members.length > 0

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-border-subtle">
      <div className="flex items-center justify-between gap-2 bg-muted/50 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
          <HugeiconsIcon
            icon={AlertIcon}
            className="size-4 shrink-0 text-amber-500"
          />
          <span className="truncate">Missing recently</span>
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
            allDone
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700',
          )}
        >
          {allDone ? 'All reached' : `${remaining} to reach`}
        </span>
      </div>
      <ul className="divide-y divide-border-subtle">
        {members.map((m) => {
          const isContacted = contacted[m.name]
          return (
            <li
              key={m.name}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 transition-colors',
                isContacted && 'bg-emerald-50/50',
              )}
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 transition-colors',
                  isContacted
                    ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                    : 'bg-muted text-muted-foreground ring-border-subtle',
                )}
              >
                {isContacted ? (
                  <HugeiconsIcon icon={CheckIcon} className="size-4" />
                ) : (
                  initials(...m.name.split(/\s+/))
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block truncate text-sm font-medium text-foreground',
                    isContacted && 'text-muted-foreground',
                  )}
                >
                  {m.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {isContacted
                    ? 'Contacted just now'
                    : `${m.weeks} weeks · last seen ${m.lastSeen}`}
                </span>
              </span>

              <button
                type="button"
                onClick={() =>
                  setContacted((prev) => ({
                    ...prev,
                    [m.name]: !prev[m.name],
                  }))
                }
                aria-pressed={isContacted}
                title={isContacted ? 'Undo' : 'Mark contacted'}
                aria-label={
                  isContacted
                    ? `Undo contacted for ${m.name}`
                    : `Mark ${m.name} contacted`
                }
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center gap-1.5 rounded-lg text-xs font-medium ring-1 transition-colors',
                  isContacted
                    ? 'text-muted-foreground ring-transparent hover:bg-black/5'
                    : 'text-foreground ring-border-subtle hover:bg-brand-600 hover:text-white hover:ring-brand-600',
                )}
              >
                <HugeiconsIcon
                  icon={isContacted ? CheckIcon : PhoneIcon}
                  className="size-4"
                />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function MinistryBreakdownCard({
  data,
}: {
  data: DashboardSummary['ministries']
}) {
  const total = data.byMinistry.reduce((sum, m) => sum + m.count, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ministries</CardTitle>
        <CardDescription>
          {data.total} ministries · {total} places filled
        </CardDescription>
        <CardLink to="/ministries">View all</CardLink>
      </CardHeader>
      <CardContent>
        <RankedBars
          items={data.byMinistry.map((m) => ({
            label: m.name,
            value: m.count,
          }))}
          total={total}
          ariaLabel={`Members across ${data.total} ministries`}
        />
      </CardContent>
    </Card>
  )
}

const activityIcon: Record<
  DashboardSummary['recentActivity'][number]['type'],
  IconSvgElement
> = {
  MEMBER_ADDED: UserIcon,
  VISITOR_REGISTERED: VisitorIcon,
  ATTENDANCE_RECORDED: ActivityCalendarIcon,
  PRAYER_SUBMITTED: PrayerIcon,
  TESTIMONY_SUBMITTED: TestimonyIcon,
}

export function RecentActivityCard({
  data,
}: {
  data: DashboardSummary['recentActivity']
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative">
          {data.map((a, i) => (
            <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
              {/* Timeline rail between icons. */}
              {i < data.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-8 bottom-0 left-3.5 w-px bg-border-subtle"
                />
              ) : null}
              <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-4 ring-card">
                <HugeiconsIcon
                  icon={activityIcon[a.type]}
                  className="size-3.5"
                />
              </span>
              <div className="min-w-0 flex-1 pt-0.5 sm:flex sm:items-baseline sm:justify-between sm:gap-4">
                <p className="text-sm text-foreground">{a.summary}</p>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {a.when}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
