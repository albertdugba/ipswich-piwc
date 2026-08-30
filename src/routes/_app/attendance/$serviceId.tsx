import { useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth/route-guards'
import { hasPermission } from '@/lib/auth/permissions'
import { isFirebaseConfigured } from '@/lib/env.public'
import {
  usePreviousServicePresent,
  useDeleteService,
  useSaveAttendance,
  useService,
  useServicePresent,
  useTogglePresent,
} from '@/features/attendance/queries'
import {
  useAllMemberships,
  useDepartments,
} from '@/features/ministries/queries'
import { usePeople } from '@/features/people/queries'
import { ServiceFormDialog } from '@/features/attendance/ServiceFormDialog'
import { AttendanceRoster } from '@/features/attendance/AttendanceRoster'
import { Button, EmptyState, ErrorState } from '@/components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertIcon,
  AttendanceIcon,
  BackIcon,
  CalendarIcon,
  CheckIcon,
  DeleteIcon,
  EditIcon,
  HugeiconsIcon,
  MinistryIcon,
  MoreIcon,
  SpinnerIcon,
} from '@/lib/icons'
import { formatDate } from '@/lib/utils'
import type { Person } from '@/domain/person'
import type { Service } from '@/domain/service'

export const Route = createFileRoute('/_app/attendance/$serviceId')({
  beforeLoad: ({ context }) =>
    requirePermission(context.user, 'attendance:read'),
  component: RecordAttendancePage,
})

const NO_PEOPLE: Person[] = []

function RecordAttendancePage() {
  const { serviceId } = Route.useParams()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const canWrite = hasPermission(user.role, 'attendance:write')

  const serviceQuery = useService(serviceId)
  const presentQuery = useServicePresent(serviceId)
  const peopleQuery = usePeople()
  const previousQuery = usePreviousServicePresent(serviceId)
  const departmentsQuery = useDepartments()
  const membershipsQuery = useAllMemberships()
  const togglePresent = useTogglePresent()
  const saveAttendance = useSaveAttendance()
  const deleteService = useDeleteService()

  const [editing, setEditing] = useState(false)

  /*
   * The server list is the single source of truth — there is no local draft and
   * no Save button. `useTogglePresent` applies each tap optimistically, so this
   * set updates instantly and rolls back by itself if a write fails.
   */
  const present = useMemo(
    () => new Set(presentQuery.data ?? []),
    [presentQuery.data],
  )

  const people = peopleQuery.data ?? NO_PEOPLE
  const presentCount = present.size
  const absentCount = Math.max(people.length - presentCount, 0)
  const pct = people.length
    ? Math.round((presentCount / people.length) * 100)
    : 0

  // Person ids per ministry, for the "mark a whole ministry present" shortcut.
  const ministries = useMemo(() => {
    const byDept = new Map<string, string[]>()
    for (const m of membershipsQuery.data ?? []) {
      const list = byDept.get(m.departmentId)
      if (list) list.push(m.personId)
      else byDept.set(m.departmentId, [m.personId])
    }
    return (departmentsQuery.data ?? [])
      .map((d) => ({ ...d, personIds: byDept.get(d.id) ?? [] }))
      .filter((d) => d.personIds.length > 0)
  }, [departmentsQuery.data, membershipsQuery.data])

  const knownIds = useMemo(() => new Set(people.map((p) => p.id)), [people])

  /** Add ids to the present set in one batched write. */
  function addPresent(personIds: string[]) {
    const next = new Set(present)
    for (const id of personIds) if (knownIds.has(id)) next.add(id)
    if (next.size === present.size) return
    saveAttendance.mutate({
      serviceId,
      presentPersonIds: [...next],
      recordedById: user.id,
    })
  }

  function handleToggle(personId: string, next: boolean) {
    togglePresent.mutate({
      serviceId,
      personId,
      present: next,
      recordedById: user.id,
    })
  }

  function handleClearAll() {
    if (present.size === 0) return
    saveAttendance.mutate({
      serviceId,
      presentPersonIds: [],
      recordedById: user.id,
    })
  }

  function handleDelete() {
    if (!serviceQuery.data) return
    const ok = window.confirm(
      `Delete “${serviceQuery.data.name}” and its attendance record?`,
    )
    if (!ok) return
    deleteService.mutate(serviceId, {
      onSuccess: () => navigate({ to: '/attendance' }),
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to="/attendance"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={BackIcon} className="size-4" />
        Back to attendance
      </Link>

      {!isFirebaseConfigured ? (
        <ErrorState
          title="Connect Firebase to record attendance"
          description="Set the VITE_FIREBASE_* variables in .env to load this service."
        />
      ) : serviceQuery.isError ? (
        <ErrorState
          title="Couldn’t load this service"
          action={
            <Button variant="outline" onClick={() => serviceQuery.refetch()}>
              Try again
            </Button>
          }
        />
      ) : !serviceQuery.isLoading && !serviceQuery.data ? (
        <EmptyState
          icon={<HugeiconsIcon icon={AttendanceIcon} className="size-8" />}
          title="Service not found"
          description="This service may have been removed."
        />
      ) : (
        <>
          {/* Header. Edit/Delete are secondary to marking the register, so
              they collapse into an overflow menu instead of two full buttons. */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white ring-2 ring-gold-400"
              >
                <HugeiconsIcon icon={AttendanceIcon} className="size-5" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
                  {serviceQuery.data?.name ?? '…'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {serviceQuery.data
                    ? formatDate(serviceQuery.data.serviceDate)
                    : ''}
                </p>
              </div>
            </div>
            {canWrite ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="icon" />}
                  aria-label="Service options"
                >
                  <HugeiconsIcon icon={MoreIcon} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditing(true)}>
                    <HugeiconsIcon icon={EditIcon} />
                    Edit service
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={deleteService.isPending}
                    onClick={handleDelete}
                  >
                    <HugeiconsIcon icon={DeleteIcon} />
                    Delete service
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          {/* Live count. Sticks to the top of the scroll area so the running
              total stays visible while you work down a long roster. */}
          <div className="sticky top-0 z-30 -mx-4 bg-neutral-50/85 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6">
            <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10">
              <div className="flex items-center gap-4">
                <ProgressRing pct={pct} />
                <div className="min-w-0 flex-1">
                  <p className="text-2xl leading-none font-semibold text-foreground tabular-nums">
                    {presentCount}
                    <span className="text-base font-normal text-muted-foreground">
                      {' '}
                      / {people.length}
                    </span>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-brand-700">
                      <span className="size-2 rounded-full bg-brand-600" />
                      {presentCount} present
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span className="size-2 rounded-full bg-neutral-300" />
                      {absentCount} absent
                    </span>
                  </div>
                </div>
                {/* Saving is per tap, so this reports state rather than
                    offering an action. */}
                <SaveStatus
                  pending={togglePresent.isPending || saveAttendance.isPending}
                  failed={Boolean(
                    togglePresent.isError || saveAttendance.isError,
                  )}
                />
              </div>
            </div>
          </div>

          {/* Roster */}
          {!peopleQuery.isLoading && people.length === 0 ? (
            <EmptyState
              title="No people yet"
              description="Add people in the Members module first."
            />
          ) : (
            <AttendanceRoster
              people={people}
              presentIds={present}
              isLoading={peopleQuery.isLoading || presentQuery.isLoading}
              canWrite={canWrite}
              onToggle={handleToggle}
              onMarkVisible={addPresent}
              actions={
                canWrite ? (
                  <BulkActions
                    ministries={ministries}
                    previous={previousQuery.data ?? null}
                    hasPresent={presentCount > 0}
                    onAddPresent={addPresent}
                    onClearAll={handleClearAll}
                  />
                ) : undefined
              }
            />
          )}
        </>
      )}

      {serviceQuery.data ? (
        <ServiceFormDialog
          open={editing}
          service={serviceQuery.data}
          onOpenChange={setEditing}
        />
      ) : null}
    </div>
  )
}

/*
 * Bulk shortcuts. All of them add to the present set rather than replacing it,
 * so combining "copy from last service" with a ministry sweep behaves the way
 * you'd expect. Clearing is the one destructive action and is separated.
 */
function BulkActions({
  ministries,
  previous,
  hasPresent,
  onAddPresent,
  onClearAll,
}: {
  ministries: { id: string; name: string; personIds: string[] }[]
  previous: { service: Service; personIds: string[] } | null
  hasPresent: boolean
  onAddPresent: (personIds: string[]) => void
  onClearAll: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Bulk actions
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {previous && previous.personIds.length > 0 ? (
          <>
            <DropdownMenuItem onClick={() => onAddPresent(previous.personIds)}>
              <HugeiconsIcon icon={CalendarIcon} />
              <span className="flex flex-col">
                <span>Copy from last service</span>
                <span className="text-xs text-muted-foreground">
                  {previous.service.name} — {previous.personIds.length} present
                </span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}

        {/* Base UI requires GroupLabel to live inside a Group. */}
        {ministries.length > 0 ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Mark a ministry present</DropdownMenuLabel>
              {ministries.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => onAddPresent(m.personIds)}
                >
                  <HugeiconsIcon icon={MinistryIcon} />
                  {m.name}
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {m.personIds.length}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}

        <DropdownMenuItem
          variant="destructive"
          disabled={!hasPresent}
          onClick={onClearAll}
        >
          <HugeiconsIcon icon={DeleteIcon} />
          Clear the register
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/*
 * Ambient save indicator — replaces the old Save button. Collapses to just the
 * icon on small screens, where the sticky bar is tight for space.
 */
function SaveStatus({
  pending,
  failed,
}: {
  pending: boolean
  failed: boolean
}) {
  if (failed) {
    return (
      <span
        role="alert"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
      >
        <HugeiconsIcon icon={AlertIcon} className="size-3.5" />
        <span className="hidden sm:inline">Couldn’t save</span>
      </span>
    )
  }
  return (
    <span
      aria-live="polite"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
    >
      {pending ? (
        <>
          <HugeiconsIcon
            icon={SpinnerIcon}
            className="size-3.5 animate-spin text-brand-600"
          />
          <span className="hidden sm:inline">Saving…</span>
        </>
      ) : (
        <>
          <HugeiconsIcon
            icon={CheckIcon}
            className="size-3.5 text-emerald-600"
          />
          <span className="hidden sm:inline">Saved</span>
        </>
      )}
    </span>
  )
}

/* Circular attendance progress. Gold track, brand fill — the church's palette. */
function ProgressRing({ pct }: { pct: number }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  return (
    <div className="relative flex size-16 shrink-0 items-center justify-center">
      <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="6"
          className="stroke-muted"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-brand-600 transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-foreground tabular-nums">
        {pct}%
      </span>
    </div>
  )
}
