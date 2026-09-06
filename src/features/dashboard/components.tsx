import { useState } from 'react'
import {
  ActivityCalendarIcon,
  AlertIcon,
  ArrowDownRight01Icon,
  ArrowUpRight01Icon,
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
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { cn, initials } from '@/lib/utils'
import {
  AreaChart,
  BarChart,
  DonutChart,
  type ChartPoint,
  type DonutSegment,
} from './charts'
import type { DashboardSummary } from './mock-data'

function TrendBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  const up = value >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
        up
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-red-50 text-red-700',
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
      <CardHeader className="border-b">
        <CardTitle>Attendance trend</CardTitle>
        <CardDescription>
          Latest: {data.latestServiceName}, {data.latestServiceDate}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                {data.latestCount}
              </span>
              <TrendBadge value={data.trendPct} suffix="%" />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              vs average of {data.average} per service
            </p>
          </div>
        </div>
        <div className="mt-2">
          <BarChart
            data={points}
            average={data.average}
            ariaLabel={`Attendance over the last ${data.weekly.length} services`}
          />
        </div>
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
      <CardHeader className="border-b">
        <CardTitle>Membership growth</CardTitle>
        <CardDescription>
          Total members over the last {months.length} months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
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
      <CardHeader className="border-b">
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>
          What the church might otherwise forget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <AttentionTile
            icon={VisitorIcon}
            tone="amber"
            label="Visitors to follow up"
            value={data.visitorsToFollowUp}
          />
          <AttentionTile
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
    chip: 'bg-amber-100 text-amber-600',
    ring: 'ring-amber-100 hover:ring-amber-200',
  },
  sky: {
    chip: 'bg-sky-100 text-sky-600',
    ring: 'ring-sky-100 hover:ring-sky-200',
  },
} as const

function AttentionTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: IconSvgElement
  label: string
  value: number
  tone: keyof typeof TILE_TONES
}) {
  const t = TILE_TONES[tone]
  return (
    <button
      type="button"
      className={cn(
        'group flex flex-col items-start gap-2 rounded-xl bg-card p-3 text-left ring-1 transition-all hover:-translate-y-px',
        t.ring,
      )}
    >
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-lg',
          t.chip,
        )}
      >
        <HugeiconsIcon icon={icon} className="size-5" />
      </span>
      <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </span>
      <span className="flex w-full items-center justify-between gap-1 text-xs font-medium text-muted-foreground">
        {label}
        <HugeiconsIcon
          icon={ChevronRightIcon}
          className="size-3.5 shrink-0 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
        />
      </span>
    </button>
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
    <div className="overflow-hidden rounded-xl border border-border-subtle">
      <div className="flex items-center justify-between gap-2 bg-muted/40 px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <HugeiconsIcon icon={AlertIcon} className="size-4 text-amber-500" />
          Members not attending recently
        </span>
        <span
          className={cn(
            'text-xs font-medium tabular-nums',
            allDone ? 'text-emerald-600' : 'text-muted-foreground',
          )}
        >
          {allDone ? 'All reached' : `${remaining} to reach`}
        </span>
      </div>
      <ul className="divide-y divide-border-subtle border-t border-border-subtle">
        {members.map((m) => {
          const isContacted = contacted[m.name]
          return (
            <li
              key={m.name}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 transition-colors',
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
                <span className="text-[11px] text-muted-foreground">
                  {isContacted
                    ? 'Contacted just now'
                    : `Last seen ${m.lastSeen}`}
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
                aria-label={
                  isContacted
                    ? `Undo contacted for ${m.name}`
                    : `Mark ${m.name} contacted`
                }
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  isContacted
                    ? 'border-transparent text-muted-foreground hover:bg-black/5'
                    : 'border-border-subtle text-foreground hover:border-brand-600 hover:bg-brand-600 hover:text-white',
                )}
              >
                <HugeiconsIcon
                  icon={isContacted ? CheckIcon : PhoneIcon}
                  className="size-3.5"
                />
                <span className="hidden sm:inline">
                  {isContacted ? 'Undo' : 'Mark contacted'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// On-brand categorical palette (indigo → gold → flame), cycled if there are
// more ministries than colours.
const MINISTRY_COLORS = [
  'var(--color-brand-600)',
  'var(--color-brand-400)',
  'var(--color-gold-500)',
  'var(--color-flame-500)',
  'var(--color-brand-800)',
  'var(--color-gold-600)',
  'var(--color-brand-300)',
  'var(--color-flame-600)',
]

export function MinistryBreakdownCard({
  data,
}: {
  data: DashboardSummary['ministries']
}) {
  const [active, setActive] = useState<number | null>(null)
  const total = data.byMinistry.reduce((sum, m) => sum + m.count, 0)
  const segments: DonutSegment[] = data.byMinistry.map((m, i) => ({
    label: m.name,
    value: m.count,
    color: MINISTRY_COLORS[i % MINISTRY_COLORS.length]!,
  }))

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Membership by ministry</CardTitle>
        <CardDescription>
          {data.total} ministries · {total} members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-5">
          <DonutChart
            segments={segments}
            centerValue={total}
            centerLabel="members"
            active={active}
            onActiveChange={setActive}
            ariaLabel={`Membership across ${data.total} ministries`}
          />
          <ul className="grid w-full grid-cols-1 gap-x-5 gap-y-1.5 sm:grid-cols-2">
            {segments.map((seg, i) => {
              const pct = total ? Math.round((seg.value / total) * 100) : 0
              const dim = active != null && active !== i
              return (
                <li
                  key={seg.label}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-opacity',
                    dim && 'opacity-40',
                  )}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {seg.label}
                  </span>
                  <span className="font-medium text-foreground tabular-nums">
                    {seg.value}
                  </span>
                  <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                    {pct}%
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
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
      <CardHeader className="border-b">
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {data.map((a) => (
            <li key={a.id} className="flex gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <HugeiconsIcon
                  icon={activityIcon[a.type]}
                  className="size-3.5"
                />
              </span>
              <div>
                <p className="text-sm text-foreground">{a.summary}</p>
                <p className="text-xs text-muted-foreground">{a.when}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
