import { membershipStatusLabels, type MembershipStatus } from '@/domain/enums'
import { cn } from '@/lib/utils'

// Membership status → colour. Kept here (not in the generic Badge) because the
// palette is domain-specific: members green, regulars blue, visitors amber.
const styles: Record<MembershipStatus, string> = {
  MEMBER: 'bg-emerald-50 text-emerald-700',
  REGULAR_ATTENDEE: 'bg-sky-50 text-sky-700',
  VISITOR: 'bg-amber-50 text-amber-700',
  INACTIVE: 'bg-muted text-muted-foreground',
}

export function MembershipBadge({ status }: { status: MembershipStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status],
      )}
    >
      {membershipStatusLabels[status]}
    </span>
  )
}
