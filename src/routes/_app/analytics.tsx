import { createFileRoute } from '@tanstack/react-router'
import { AnalyticsIcon } from '@/lib/icons'
import { PlaceholderPage } from '@/components/layout/PlaceholderPage'
import { requirePermission } from '@/lib/auth/route-guards'

export const Route = createFileRoute('/_app/analytics')({
  beforeLoad: ({ context }) =>
    requirePermission(context.user, 'analytics:read'),
  component: AnalyticsPage,
})

function AnalyticsPage() {
  return (
    <PlaceholderPage
      title="Analytics"
      description="Answers to real church questions, derived from actual data."
      phase="Phase 7 (Analytics)"
      icon={AnalyticsIcon}
      bullets={[
        'Membership growth',
        'Attendance trends',
        'Ministry participation',
        'Visitor conversion',
      ]}
    />
  )
}
