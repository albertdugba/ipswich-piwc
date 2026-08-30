import {
  ActivityCalendarIcon,
  AlertIcon,
  HugeiconsIcon,
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
import { cn } from '@/lib/utils'
import type { DashboardSummary } from './mock-data'

export function AttendanceTrendCard({
  data,
}: {
  data: DashboardSummary['attendance']
}) {
  const max = Math.max(...data.weekly.map((w) => w.count), 1)
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Attendance trend</CardTitle>
        <CardDescription>
          Latest: {data.latestServiceName}, {data.latestServiceDate}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-foreground">
            {data.latestCount}
          </span>
          <span className="text-sm text-muted-foreground">
            avg {data.average} · +{data.trendPct}% vs avg
          </span>
        </div>
        <div
          className="mt-4 flex h-32 items-end gap-2"
          role="img"
          aria-label={`Attendance over the last ${data.weekly.length} services`}
        >
          {data.weekly.map((w, i) => {
            const isLast = i === data.weekly.length - 1
            return (
              <div
                key={w.label}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all',
                    isLast ? 'bg-brand-600' : 'bg-brand-200',
                  )}
                  style={{ height: `${(w.count / max) * 100}%` }}
                  title={`${w.label}: ${w.count}`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {w.label}
                </span>
              </div>
            )
          })}
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
      <CardContent className="space-y-3">
        <AttentionRow
          icon={VisitorIcon}
          tone="amber"
          label="Visitors needing follow-up"
          value={data.visitorsToFollowUp}
        />
        <AttentionRow
          icon={PrayerIcon}
          tone="sky"
          label="New prayer requests"
          value={data.newPrayerRequests}
        />
        <div className="rounded-lg bg-muted/60 p-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <HugeiconsIcon icon={AlertIcon} className="size-4 text-amber-500" />
            Members not attending recently
          </p>
          <ul className="space-y-1.5">
            {data.absentMembers.map((m) => (
              <li
                key={m.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-foreground">
                  <HugeiconsIcon
                    icon={UserIcon}
                    className="size-3.5 text-muted-foreground"
                  />
                  {m.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {m.weeks} weeks away
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function AttentionRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: IconSvgElement
  label: string
  value: number
  tone: 'amber' | 'sky'
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/60 p-3">
      <span className="flex items-center gap-2 text-sm text-foreground">
        <HugeiconsIcon
          icon={icon}
          className={cn(
            'size-4',
            tone === 'amber' ? 'text-amber-500' : 'text-sky-500',
          )}
        />
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}

export function MinistryBreakdownCard({
  data,
}: {
  data: DashboardSummary['ministries']
}) {
  const max = Math.max(...data.byMinistry.map((m) => m.count), 1)
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Membership by ministry</CardTitle>
        <CardDescription>{data.total} ministries</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {data.byMinistry.map((m) => (
            <li key={m.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-foreground">{m.name}</span>
                <span className="font-medium text-foreground">{m.count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-brand-500"
                  style={{ width: `${(m.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
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
