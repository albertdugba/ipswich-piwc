import { createFileRoute } from '@tanstack/react-router'
import { ReminderIcon } from '@/lib/icons'
import { PlaceholderPage } from '@/components/layout/PlaceholderPage'
import { requirePermission } from '@/lib/auth/route-guards'

export const Route = createFileRoute('/_app/reminders')({
  beforeLoad: ({ context }) =>
    requirePermission(context.user, 'reminders:read'),
  component: RemindersPage,
})

function RemindersPage() {
  return (
    <PlaceholderPage
      title="Reminders"
      description="The software remembers what the church might forget."
      phase="Phase 6 (Reminders)"
      icon={ReminderIcon}
      bullets={[
        'Birthdays',
        'Marriage anniversaries',
        'Membership anniversaries',
        'Needs-attention feed',
      ]}
    />
  )
}
