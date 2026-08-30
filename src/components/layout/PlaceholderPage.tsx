import { HugeiconsIcon, type IconSvgElement } from '@/lib/icons'
import { EmptyState, PageHeader } from '@/components/ui'

/*
 * Shared placeholder for modules not yet implemented. Each module route renders
 * this with its own title/description and intended-phase note, so the
 * navigation is fully wired while implementation happens one phase at a time.
 */
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
