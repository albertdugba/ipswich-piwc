import { useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { requirePermission } from '@/lib/auth/route-guards'
import { hasPermission } from '@/lib/auth/permissions'
import { isFirebaseConfigured } from '@/lib/env.public'
import {
  useDepartment,
  useDepartmentMembers,
  useDeleteDepartment,
  useRemoveDepartmentMember,
  useSetDepartmentMember,
} from '@/features/ministries/queries'
import { usePeople } from '@/features/people/queries'
import { DepartmentFormDialog } from '@/features/ministries/DepartmentFormDialog'
import { AddMemberDialog } from '@/features/ministries/AddMemberDialog'
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AddIcon,
  BackIcon,
  DeleteIcon,
  EditIcon,
  HugeiconsIcon,
  MinistryIcon,
  StarIcon,
} from '@/lib/icons'
import {
  departmentRoleLabels,
  departmentRoleValues,
  type DepartmentRole,
} from '@/domain/enums'
import { displayName } from '@/lib/utils'
import type { Person } from '@/domain/person'
import type { DepartmentMembership } from '@/domain/department'

type MemberRow = { membership: DepartmentMembership; person: Person }

export const Route = createFileRoute('/_app/ministries/$departmentId')({
  beforeLoad: ({ context }) =>
    requirePermission(context.user, 'departments:read'),
  component: MinistryDetailPage,
})

const roleOrder: Record<DepartmentRole, number> = {
  LEADER: 0,
  ASSISTANT_LEADER: 1,
  MEMBER: 2,
}

function MinistryDetailPage() {
  const { departmentId } = Route.useParams()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const canWrite = hasPermission(user.role, 'departments:write')

  const [editing, setEditing] = useState(false)
  const [addingMember, setAddingMember] = useState(false)

  const deptQuery = useDepartment(departmentId)
  const membersQuery = useDepartmentMembers(departmentId)
  const peopleQuery = usePeople()
  const setMember = useSetDepartmentMember()
  const removeMember = useRemoveDepartmentMember()
  const deleteDept = useDeleteDepartment()

  const rows = useMemo(() => {
    const byId = new Map<string, Person>(
      (peopleQuery.data ?? []).map((p) => [p.id, p]),
    )
    return (membersQuery.data ?? [])
      .map((m) => ({ membership: m, person: byId.get(m.personId) }))
      .filter((r): r is MemberRow => Boolean(r.person))
      .sort(
        (a, b) =>
          roleOrder[a.membership.role] - roleOrder[b.membership.role] ||
          displayName(a.person).localeCompare(displayName(b.person)),
      )
  }, [membersQuery.data, peopleQuery.data])

  const existingPersonIds = useMemo(
    () => new Set((membersQuery.data ?? []).map((m) => m.personId)),
    [membersQuery.data],
  )

  const memberColumns = useMemo<ColumnDef<MemberRow, unknown>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (r) => displayName(r.person),
        header: 'Name',
        cell: ({ row }) => {
          const { membership, person } = row.original
          const isLead =
            membership.role === 'LEADER' ||
            membership.role === 'ASSISTANT_LEADER'
          return (
            <Link
              to="/people/$personId"
              params={{ personId: person.id }}
              className="inline-flex items-center gap-2 font-medium text-foreground hover:text-brand-700"
            >
              {isLead ? (
                <HugeiconsIcon
                  icon={StarIcon}
                  className="size-3.5 text-gold-600"
                />
              ) : null}
              {displayName(person)}
            </Link>
          )
        },
      },
      {
        id: 'role',
        accessorFn: (r) => departmentRoleLabels[r.membership.role],
        header: 'Role',
        enableSorting: false,
        cell: ({ row }) => {
          const { membership, person } = row.original
          return canWrite ? (
            <RoleSelect
              value={membership.role}
              disabled={setMember.isPending}
              onChange={(role) =>
                setMember.mutate({ departmentId, personId: person.id, role })
              }
            />
          ) : (
            departmentRoleLabels[membership.role]
          )
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        meta: { className: 'w-14', nowrap: true },
        cell: ({ row }) => {
          const { person } = row.original
          return canWrite ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${displayName(person)}`}
              disabled={removeMember.isPending}
              onClick={() =>
                removeMember.mutate({ departmentId, personId: person.id })
              }
            >
              <HugeiconsIcon icon={DeleteIcon} />
            </Button>
          ) : null
        },
      },
    ],
    [canWrite, departmentId, setMember, removeMember],
  )

  function handleDelete() {
    if (!deptQuery.data) return
    const ok = window.confirm(
      `Delete “${deptQuery.data.name}”? This removes the ministry and its ${rows.length} membership(s). People are not deleted.`,
    )
    if (!ok) return
    deleteDept.mutate(departmentId, {
      onSuccess: () => navigate({ to: '/ministries' }),
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/ministries"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={BackIcon} className="size-4" />
        Back to ministries
      </Link>

      {!isFirebaseConfigured ? (
        <ErrorState
          title="Connect Firebase to view ministries"
          description="Set the VITE_FIREBASE_* variables in .env to load ministry details."
        />
      ) : deptQuery.isLoading ? (
        <LoadingState label="Loading ministry…" />
      ) : deptQuery.isError ? (
        <ErrorState
          title="Couldn’t load this ministry"
          action={
            <Button variant="outline" onClick={() => deptQuery.refetch()}>
              Try again
            </Button>
          }
        />
      ) : !deptQuery.data ? (
        <EmptyState
          icon={<HugeiconsIcon icon={MinistryIcon} className="size-8" />}
          title="Ministry not found"
          description="This ministry may have been removed."
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-600 text-white ring-2 ring-gold-400">
                <HugeiconsIcon icon={MinistryIcon} className="size-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-foreground">
                    {deptQuery.data.name}
                  </h1>
                  {deptQuery.data.isActive ? null : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                {deptQuery.data.description ? (
                  <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                    {deptQuery.data.description}
                  </p>
                ) : null}
              </div>
            </div>
            {canWrite ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <HugeiconsIcon icon={EditIcon} />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleteDept.isPending}
                >
                  <HugeiconsIcon icon={DeleteIcon} />
                  Delete
                </Button>
              </div>
            ) : null}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-medium text-foreground">
                Members ({rows.length})
              </h2>
              {canWrite ? (
                <Button onClick={() => setAddingMember(true)}>
                  <HugeiconsIcon icon={AddIcon} />
                  Add member
                </Button>
              ) : null}
            </div>
            {membersQuery.isLoading || peopleQuery.isLoading ? (
              <LoadingState label="Loading members…" />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<HugeiconsIcon icon={MinistryIcon} className="size-8" />}
                title="No members yet"
                description="Add people to this ministry to build it out."
                action={
                  canWrite ? (
                    <Button onClick={() => setAddingMember(true)}>
                      <HugeiconsIcon icon={AddIcon} />
                      Add member
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <DataTable
                columns={memberColumns}
                data={rows}
                getRowId={(r) => r.membership.id}
                searchable
                searchPlaceholder="Search members"
                rowNoun={['member', 'members']}
              />
            )}
          </div>
        </>
      )}

      {deptQuery.data ? (
        <DepartmentFormDialog
          open={editing}
          department={deptQuery.data}
          onOpenChange={setEditing}
        />
      ) : null}
      <AddMemberDialog
        open={addingMember}
        onOpenChange={setAddingMember}
        departmentId={departmentId}
        existingPersonIds={existingPersonIds}
      />
    </div>
  )
}

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: DepartmentRole
  onChange: (role: DepartmentRole) => void
  disabled?: boolean
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange((v as DepartmentRole) ?? 'MEMBER')}
    >
      <SelectTrigger className="w-40" disabled={disabled}>
        <SelectValue>
          {(v: string | null) =>
            v ? departmentRoleLabels[v as DepartmentRole] : 'Role'
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {departmentRoleValues.map((r) => (
          <SelectItem key={r} value={r}>
            {departmentRoleLabels[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
