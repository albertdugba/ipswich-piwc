import { createFileRoute } from '@tanstack/react-router'
import { SettingsIcon } from '@/lib/icons'
import { PlaceholderPage } from '@/components/layout/PlaceholderPage'
import { requirePermission } from '@/lib/auth/route-guards'

export const Route = createFileRoute('/_app/settings')({
  beforeLoad: ({ context }) =>
    requirePermission(context.user, 'settings:manage'),
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Church, roles and configuration."
      phase="Phase 1+ (Foundation, expanded later)"
      icon={SettingsIcon}
      bullets={['Users & roles', 'Departments seed', 'Church profile']}
    />
  )
}
