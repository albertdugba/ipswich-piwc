import { createFileRoute } from '@tanstack/react-router'
import {
  AttendanceIcon,
  MembersIcon,
  UserCheck01Icon,
  VisitorIcon,
} from '@/lib/icons'
import { StatCard } from '@/components/ui'
import {
  AttendanceTrendCard,
  DashboardHero,
  MembershipGrowthCard,
  MinistryBreakdownCard,
  NeedsAttentionCard,
  QuickActions,
  RecentActivityCard,
} from '@/features/dashboard/components'
import { dashboardMock } from '@/features/dashboard/mock-data'
import { Sparkline } from '@/features/dashboard/charts'
import { UpcomingCelebrationsCard } from '@/features/reminders/UpcomingCelebrationsCard'

export const Route = createFileRoute('/_app/dashboard')({
  loader: () => ({ summary: dashboardMock }),
  component: DashboardPage,
})

function DashboardPage() {
  const { summary } = Route.useLoaderData()
  const { user } = Route.useRouteContext()

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardHero user={user} attendance={summary.attendance} />

      <QuickActions user={user} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total members"
          value={summary.membership.total}
          icon={MembersIcon}
          trend={summary.membership.totalTrendPct}
          hint="All people on record"
          chart={
            <Sparkline
              data={summary.membershipGrowth.monthly.map((m) => m.total)}
            />
          }
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
          hint="Joined since the 1st"
        />
        <StatCard
          label="Visitors"
          value={summary.membership.visitors}
          icon={AttendanceIcon}
          hint="Being followed up"
        />
      </div>

      {/*
        Phones get one column ordered by urgency (to-dos before charts); the
        two column wrappers dissolve via `contents` so `order-*` can interleave
        their cards. From `lg` they become a main column and a side rail.
      */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:items-start">
        <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-4">
          <div className="order-2 lg:order-none">
            <AttendanceTrendCard data={summary.attendance} />
          </div>
          <div className="order-4 lg:order-none">
            <MembershipGrowthCard data={summary.membershipGrowth} />
          </div>
          <div className="order-6 lg:order-none">
            <RecentActivityCard data={summary.recentActivity} />
          </div>
        </div>
        <div className="contents lg:flex lg:flex-col lg:gap-4">
          <div className="order-1 lg:order-none">
            <NeedsAttentionCard data={summary.needsAttention} />
          </div>
          <div className="order-3 lg:order-none">
            <UpcomingCelebrationsCard windowDays={7} />
          </div>
          <div className="order-5 lg:order-none">
            <MinistryBreakdownCard data={summary.ministries} />
          </div>
        </div>
      </div>
    </div>
  )
}
