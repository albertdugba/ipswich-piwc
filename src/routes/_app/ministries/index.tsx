import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth/route-guards'
import { hasPermission } from '@/lib/auth/permissions'
import { isFirebaseConfigured } from '@/lib/env.public'
import {
  useAllMemberships,
  useDepartments,
  useSeedDepartments,
} from '@/features/ministries/queries'
import { DepartmentFormDialog } from '@/features/ministries/DepartmentFormDialog'
import { MinistryCard } from '@/features/ministries/MinistryCard'
import { usePeople } from '@/features/people/queries'
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/components/ui'
import { AddIcon, HugeiconsIcon, MinistryIcon } from '@/lib/icons'
import type { Department } from '@/domain/department'
import type { Person } from '@/domain/person'

export const Route = createFileRoute('/_app/ministries/')({
  beforeLoad: ({ context }) =>
    requirePermission(context.user, 'departments:read'),
  component: MinistriesPage,
})

function MinistriesPage() {
  const { user } = Route.useRouteContext()
  const canWrite = hasPermission(user.role, 'departments:write')

  const [dialog, setDialog] = useState<{ open: boolean; dept?: Department }>({
    open: false,
  })

  const query = useDepartments()
  const membershipsQuery = useAllMemberships()
  const peopleQuery = usePeople()
  const seed = useSeedDepartments()

  // Per-department roster: member count, leader and a few members for avatars.
  const deptInfo = useMemo(() => {
    const peopleById = new Map<string, Person>(
      (peopleQuery.data ?? []).map((p) => [p.id, p]),
    )
    const map = new Map<
      string,
      { count: number; leader: Person | null; members: Person[] }
    >()
    for (const m of membershipsQuery.data ?? []) {
      const person = peopleById.get(m.personId)
      if (!person) continue
      const entry = map.get(m.departmentId) ?? {
        count: 0,
        leader: null,
        members: [],
      }
      entry.count += 1
      entry.members.push(person)
      if (m.role === 'LEADER' && !entry.leader) entry.leader = person
      map.set(m.departmentId, entry)
    }
    return map
  }, [membershipsQuery.data, peopleQuery.data])

  const departments = query.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ministries"
        description="Departments and ministries — a person can belong to many."
        actions={
          canWrite && isFirebaseConfigured ? (
            <Button onClick={() => setDialog({ open: true })}>
              <HugeiconsIcon icon={AddIcon} />
              Add ministry
            </Button>
          ) : undefined
        }
      />

      {!isFirebaseConfigured ? (
        <ErrorState
          title="Connect Firebase to manage ministries"
          description="Set the VITE_FIREBASE_* variables in .env (or run the Firebase emulator) so ministries can be read and written."
        />
      ) : query.isLoading ? (
        <LoadingState label="Loading ministries…" />
      ) : query.isError ? (
        <ErrorState
          title="Couldn’t load ministries"
          description={
            query.error instanceof Error ? query.error.message : undefined
          }
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : departments.length === 0 ? (
        <EmptyState
          icon={<HugeiconsIcon icon={MinistryIcon} className="size-8" />}
          title="No ministries yet"
          description="Create ministries from scratch, or add the common ones to get started."
          action={
            canWrite ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => setDialog({ open: true })}>
                  <HugeiconsIcon icon={AddIcon} />
                  Add ministry
                </Button>
                <Button
                  variant="outline"
                  onClick={() => seed.mutate()}
                  disabled={seed.isPending}
                >
                  {seed.isPending ? 'Adding…' : 'Add common ministries'}
                </Button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {departments.map((dept) => {
            const info = deptInfo.get(dept.id)
            return (
              <MinistryCard
                key={dept.id}
                department={dept}
                count={info?.count ?? 0}
                members={info?.members ?? []}
                leader={info?.leader ?? null}
              />
            )
          })}
        </div>
      )}

      <DepartmentFormDialog
        open={dialog.open}
        department={dialog.dept}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </div>
  )
}
