import { createFileRoute } from '@tanstack/react-router'
import {
  AttendanceIcon,
  MembersIcon,
  UserCheck01Icon,
  VisitorIcon,
} from '@/lib/icons'
import { PageHeader, StatCard } from '@/components/ui'
import {
  AnniversariesCard,
  AttendanceTrendCard,
  BirthdaysCard,
  MinistryBreakdownCard,
  NeedsAttentionCard,
  RecentActivityCard,
} from '@/features/dashboard/components'
import { dashboardMock } from '@/features/dashboard/mock-data'

/*
 * The dashboard answers "what do I need to know about the church today?".
 * It currently renders MOCK data (foundation phase); each card is shaped to
 * accept the same data a real loader will provide later.
 */
export const Route = createFileRoute('/_app/dashboard')({
  loader: () => ({ summary: dashboardMock }),
  component: DashboardPage,
})

function DashboardPage() {
  const { summary } = Route.useLoaderData()
  const { user } = Route.useRouteContext()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user.displayName.split(' ')[0]}`}
        description="Here’s what’s happening at Ipswich PIWC today."
      />

      {/* Membership KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total members"
          value={summary.membership.total}
          icon={MembersIcon}
          trend={summary.membership.totalTrendPct}
          hint="All people on record"
        />
        <StatCard
          label="Active members"
          value={summary.membership.active}
          icon={UserCheck01Icon}
          hint="Attending regularly"
        />
        <StatCard
          label="New this month"
          value={summary.membership.newThisMonth}
          icon={VisitorIcon}
        />
        <StatCard
          label="Visitors"
          value={summary.membership.visitors}
          icon={AttendanceIcon}
          hint="Being followed up"
        />
      </div>

      {/* Attendance + needs attention */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceTrendCard data={summary.attendance} />
        </div>
        <NeedsAttentionCard data={summary.needsAttention} />
      </div>

      {/* Reminders */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BirthdaysCard data={summary.birthdays} />
        <AnniversariesCard data={summary.anniversaries} />
      </div>

      {/* Ministries + activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MinistryBreakdownCard data={summary.ministries} />
        <RecentActivityCard data={summary.recentActivity} />
      </div>
    </div>
  )
}
