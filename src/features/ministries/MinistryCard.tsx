import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui'
import {
  ChevronRightIcon,
  HugeiconsIcon,
  MinistryIcon,
  StarIcon,
} from '@/lib/icons'
import { cn, displayName, initials } from '@/lib/utils'
import type { Department } from '@/domain/department'
import type { Person } from '@/domain/person'

const MAX_AVATARS = 5

export function MinistryCard({
  department,
  count,
  members,
  leader,
}: {
  department: Department
  count: number
  members: Person[]
  leader: Person | null
}) {
  const inactive = !department.isActive

  return (
    <Link
      to="/ministries/$departmentId"
      params={{ departmentId: department.id }}
      className="group flex h-full flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm hover:ring-brand-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
            inactive
              ? 'bg-muted text-muted-foreground'
              : 'bg-brand-50 text-brand-600 group-hover:bg-brand-100',
          )}
        >
          <HugeiconsIcon icon={MinistryIcon} className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-foreground">
              {department.name}
            </h3>
            {inactive ? (
              <Badge variant="secondary" className="shrink-0">
                Inactive
              </Badge>
            ) : null}
          </div>

          {leader ? (
            <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <HugeiconsIcon
                icon={StarIcon}
                className="size-3.5 shrink-0 text-gold-600"
              />
              <span className="shrink-0">Led by</span>
              <span className="truncate font-medium text-foreground">
                {displayName(leader)}
              </span>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              No leader assigned
            </p>
          )}
        </div>

        <HugeiconsIcon
          icon={ChevronRightIcon}
          className="mt-2.5 size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-brand-600"
        />
      </div>

      <div className="mt-4 flex-1">
        <p
          className={cn(
            'line-clamp-2 text-sm leading-relaxed',
            department.description
              ? 'text-muted-foreground'
              : 'text-muted-foreground/50 italic',
          )}
        >
          {department.description || 'No description yet.'}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        {count > 0 ? (
          <div className="flex -space-x-1.5">
            {members.slice(0, MAX_AVATARS).map((p) => (
              <span
                key={p.id}
                title={displayName(p)}
                className="flex size-7 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700 ring-2 ring-card"
              >
                {initials(p.firstName, p.lastName)}
              </span>
            ))}
            {count > MAX_AVATARS ? (
              <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card">
                +{count - MAX_AVATARS}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/60">
            No members yet
          </span>
        )}

        <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
          {count} {count === 1 ? 'member' : 'members'}
        </span>
      </div>
    </Link>
  )
}
