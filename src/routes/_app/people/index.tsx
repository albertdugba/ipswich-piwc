import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { requirePermission } from '@/lib/auth/route-guards'
import { hasPermission } from '@/lib/auth/permissions'
import { isFirebaseConfigured } from '@/lib/env.public'
import { usePeople } from '@/features/people/queries'
import { PersonFormDialog } from '@/features/people/PersonFormDialog'
import { MembershipBadge } from '@/features/people/MembershipBadge'
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
} from '@/components/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddIcon, EditIcon, HugeiconsIcon, MembersIcon } from '@/lib/icons'
import {
  membershipStatusLabels,
  membershipStatusValues,
  type MembershipStatus,
} from '@/domain/enums'
import { ageFromDob, displayName, initials } from '@/lib/utils'
import type { Person } from '@/domain/person'

export const Route = createFileRoute('/_app/people/')({
  beforeLoad: ({ context }) => requirePermission(context.user, 'people:read'),
  component: MembersPage,
})

type StatusFilter = MembershipStatus | 'ALL'

const NO_PEOPLE: Person[] = []

function MembersPage() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const canWrite = hasPermission(user.role, 'people:write')

  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [dialog, setDialog] = useState<{ open: boolean; person?: Person }>({
    open: false,
  })

  const query = usePeople()
  const people = query.data ?? NO_PEOPLE

  const filtered = useMemo(
    () =>
      status === 'ALL'
        ? people
        : people.filter((p) => p.membershipStatus === status),
    [people, status],
  )

  const columns = useMemo<ColumnDef<Person, unknown>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (p) => displayName(p),
        header: 'Name',
        meta: { nowrap: true },
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700"
            >
              {initials(row.original.firstName, row.original.lastName)}
            </span>
            <span className="font-medium text-foreground">
              {displayName(row.original)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'membershipStatus',
        header: 'Status',
        meta: { nowrap: true },
        cell: ({ row }) => (
          <MembershipBadge status={row.original.membershipStatus} />
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.phone ?? '—'}
          </span>
        ),
        meta: { className: 'hidden md:table-cell', nowrap: true },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.email ?? '—'}
          </span>
        ),
        meta: { className: 'hidden lg:table-cell' },
      },
      {
        id: 'age',
        accessorFn: (p) => ageFromDob(p.dateOfBirth) ?? '',
        header: 'Age',
        cell: ({ row }) => ageFromDob(row.original.dateOfBirth) ?? '—',
        meta: {
          className: 'hidden sm:table-cell text-muted-foreground',
          align: 'right',
          nowrap: true,
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        meta: { className: 'w-14', nowrap: true },
        cell: ({ row }) =>
          canWrite ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${displayName(row.original)}`}
              onClick={(e) => {
                e.stopPropagation()
                setDialog({ open: true, person: row.original })
              }}
            >
              <HugeiconsIcon icon={EditIcon} />
            </Button>
          ) : null,
      },
    ],
    [canWrite],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="The people of the church — the foundation of everything else."
        actions={
          canWrite ? (
            <Button
              onClick={() => setDialog({ open: true })}
              disabled={!isFirebaseConfigured}
            >
              <HugeiconsIcon icon={AddIcon} />
              Add member
            </Button>
          ) : undefined
        }
      />

      {!isFirebaseConfigured ? (
        <ErrorState
          title="Connect Firebase to manage people"
          description="Set the VITE_FIREBASE_* variables in .env (or run the Firebase emulator) so People data can be read and written."
        />
      ) : query.isError ? (
        <ErrorState
          title="Couldn’t load members"
          description={
            query.error instanceof Error ? query.error.message : undefined
          }
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : !query.isLoading && people.length === 0 ? (
        <EmptyState
          icon={<HugeiconsIcon icon={MembersIcon} className="size-8" />}
          title="No people yet"
          description="Add your first member, visitor or attendee to get started."
          action={
            canWrite ? (
              <Button onClick={() => setDialog({ open: true })}>
                <HugeiconsIcon icon={AddIcon} />
                Add member
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(p) => p.id}
          isLoading={query.isLoading}
          loadingLabel="Loading members…"
          searchable
          searchPlaceholder="Search by name, email or phone"
          rowNoun={['person', 'people']}
          onRowClick={(p) =>
            navigate({
              to: '/people/$personId',
              params: { personId: p.id },
            })
          }
          toolbar={
            <Select
              value={status}
              onValueChange={(v) => setStatus((v as StatusFilter) ?? 'ALL')}
            >
              <SelectTrigger className="w-44">
                <SelectValue>
                  {(v: string | null) =>
                    v && v !== 'ALL'
                      ? membershipStatusLabels[v as MembershipStatus]
                      : 'All statuses'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {membershipStatusValues.map((s) => (
                  <SelectItem key={s} value={s}>
                    {membershipStatusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      )}

      <PersonFormDialog
        open={dialog.open}
        person={dialog.person}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </div>
  )
}
