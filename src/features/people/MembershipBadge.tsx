import { membershipStatusLabels, type MembershipStatus } from '@/domain/enums'
import { cn } from '@/lib/utils'

const styles: Record<MembershipStatus, string> = {
  MEMBER: 'bg-emerald-100 text-emerald-800 ring-emerald-600/25',
  REGULAR_ATTENDEE: 'bg-sky-100 text-sky-800 ring-sky-600/25',
  VISITOR: 'bg-amber-100 text-amber-900 ring-amber-600/30',
  INACTIVE: 'bg-neutral-100 text-neutral-600 ring-neutral-500/25',
  DECEASED: 'bg-neutral-200 text-neutral-700 ring-neutral-500/30',
}

export function MembershipBadge({ status }: { status: MembershipStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        styles[status],
      )}
    >
      {membershipStatusLabels[status]}
    </span>
  )
}
