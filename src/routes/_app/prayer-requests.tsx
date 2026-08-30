import { createFileRoute } from '@tanstack/react-router'
import { PrayerIcon } from '@/lib/icons'
import { PlaceholderPage } from '@/components/layout/PlaceholderPage'
import { requirePermission } from '@/lib/auth/route-guards'

export const Route = createFileRoute('/_app/prayer-requests')({
  beforeLoad: ({ context }) => requirePermission(context.user, 'prayer:read'),
  component: PrayerRequestsPage,
})

function PrayerRequestsPage() {
  return (
    <PlaceholderPage
      title="Prayer Requests"
      description="Private requests are never auto-published."
      phase="Phase 8 (Member Experience)"
      icon={PrayerIcon}
      bullets={['New requests', 'Being prayed for', 'Answered', 'Visibility']}
    />
  )
}
