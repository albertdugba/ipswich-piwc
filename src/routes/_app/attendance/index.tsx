import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { requirePermission } from '@/lib/auth/route-guards'
import { hasPermission } from '@/lib/auth/permissions'
import { isFirebaseConfigured } from '@/lib/env.public'
import { useServices } from '@/features/attendance/queries'
import { ServiceFormDialog } from '@/features/attendance/ServiceFormDialog'
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
} from '@/components/ui'
import {
  AddIcon,
  AttendanceIcon,
  HugeiconsIcon,
  MembersIcon,
} from '@/lib/icons'
import { formatDate } from '@/lib/utils'
import type { Service } from '@/domain/service'

export const Route = createFileRoute('/_app/attendance/')({
  beforeLoad: ({ context }) =>
    requirePermission(context.user, 'attendance:read'),
  component: AttendancePage,
})

const NO_SERVICES: Service[] = []

function AttendancePage() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const canWrite = hasPermission(user.role, 'attendance:write')
  const [adding, setAdding] = useState(false)

  const query = useServices()
  const services = query.data ?? NO_SERVICES

  const stats = useMemo(() => {
    if (services.length === 0) return null
    const total = services.reduce((sum, s) => sum + s.presentCount, 0)
    return {
      services: services.length,
      average: Math.round(total / services.length),
      latest: services[0]?.presentCount ?? 0,
    }
  }, [services])

  const columns = useMemo<ColumnDef<Service, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Service',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: 'serviceDate',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.serviceDate)}
          </span>
        ),
      },
      {
        accessorKey: 'presentCount',
        header: 'Present',
        meta: { className: 'text-right' },
        cell: ({ row }) => (
          <div className="text-right font-medium text-foreground">
            {row.original.presentCount}
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Record who attended each service and track the trend."
        actions={
          canWrite && isFirebaseConfigured ? (
            <Button onClick={() => setAdding(true)}>
              <HugeiconsIcon icon={AddIcon} />
              Add service
            </Button>
          ) : undefined
        }
      />

      {!isFirebaseConfigured ? (
        <ErrorState
          title="Connect Firebase to record attendance"
          description="Set the VITE_FIREBASE_* variables in .env (or run the Firebase emulator) so services and attendance can be saved."
        />
      ) : query.isError ? (
        <ErrorState
          title="Couldn’t load services"
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : !query.isLoading && services.length === 0 ? (
        <EmptyState
          icon={<HugeiconsIcon icon={AttendanceIcon} className="size-8" />}
          title="No services yet"
          description="Create your first service, then record who attended."
          action={
            canWrite ? (
              <Button onClick={() => setAdding(true)}>
                <HugeiconsIcon icon={AddIcon} />
                Add service
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {stats ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Services recorded"
                value={stats.services}
                icon={AttendanceIcon}
              />
              <StatCard
                label="Average attendance"
                value={stats.average}
                icon={MembersIcon}
              />
              <StatCard
                label="Latest service"
                value={stats.latest}
                icon={MembersIcon}
                hint={services[0]?.name}
              />
            </div>
          ) : null}

          <DataTable
            columns={columns}
            data={services}
            getRowId={(s) => s.id}
            isLoading={query.isLoading}
            loadingLabel="Loading services…"
            searchable
            searchPlaceholder="Search services"
            pageSize={10}
            onRowClick={(s) =>
              navigate({
                to: '/attendance/$serviceId',
                params: { serviceId: s.id },
              })
            }
          />
        </>
      )}

      <ServiceFormDialog
        open={adding}
        onOpenChange={setAdding}
        onCreated={(id) =>
          navigate({ to: '/attendance/$serviceId', params: { serviceId: id } })
        }
      />
    </div>
  )
}
