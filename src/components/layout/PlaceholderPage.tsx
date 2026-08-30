import { HugeiconsIcon, type IconSvgElement } from '@/lib/icons'
import { EmptyState, PageHeader } from '@/components/ui'

export function PlaceholderPage({
  title,
  description,
  phase,
  icon,
  bullets,
}: {
  title: string
  description: string
  phase: string
  icon: IconSvgElement
  bullets?: string[]
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<HugeiconsIcon icon={icon} className="size-8" />}
        title={`${title} — coming in ${phase}`}
        description={
          bullets?.length
            ? `Planned: ${bullets.join(' · ')}`
            : 'This module is scaffolded and will be built in a later phase.'
        }
      />
    </div>
  )
}
