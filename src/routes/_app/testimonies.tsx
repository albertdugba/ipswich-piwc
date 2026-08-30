import { createFileRoute } from '@tanstack/react-router'
import { TestimonyIcon } from '@/lib/icons'
import { PlaceholderPage } from '@/components/layout/PlaceholderPage'
import { requirePermission } from '@/lib/auth/route-guards'

export const Route = createFileRoute('/_app/testimonies')({
  beforeLoad: ({ context }) =>
    requirePermission(context.user, 'testimonies:read'),
  component: TestimoniesPage,
})

function TestimoniesPage() {
  return (
    <PlaceholderPage
      title="Testimonies"
      description="Always moderated — nothing is published without approval."
      phase="Phase 8 (Member Experience)"
      icon={TestimonyIcon}
      bullets={['Pending', 'Approved', 'Published', 'Rejected']}
    />
  )
}
