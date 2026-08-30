import { useState, type ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth/route-guards'
import { hasPermission } from '@/lib/auth/permissions'
import { isFirebaseConfigured } from '@/lib/env.public'
import { usePerson } from '@/features/people/queries'
import { PersonFormDialog } from '@/features/people/PersonFormDialog'
import { MembershipBadge } from '@/features/people/MembershipBadge'
import { PersonMinistries } from '@/features/ministries/PersonMinistries'
import { PersonAttendance } from '@/features/attendance/PersonAttendance'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui'
import {
  BackIcon,
  CalendarIcon,
  EditIcon,
  HugeiconsIcon,
  LocationIcon,
  MailIcon,
  MembersIcon,
  PhoneIcon,
  type IconSvgElement,
} from '@/lib/icons'
import {
  genderLabels,
  maritalStatusLabels,
  type Gender,
  type MaritalStatus,
} from '@/domain/enums'
import { ageFromDob, displayName, formatDate, initials } from '@/lib/utils'
import type { Person } from '@/domain/person'

export const Route = createFileRoute('/_app/people/$personId')({
  beforeLoad: ({ context }) => requirePermission(context.user, 'people:read'),
  component: PersonProfilePage,
})

function PersonProfilePage() {
  const { personId } = Route.useParams()
  const { user } = Route.useRouteContext()
  const canWrite = hasPermission(user.role, 'people:read')
  const canSeeSensitive = hasPermission(user.role, 'people:read_sensitive')
  const [editing, setEditing] = useState(false)

  const query = usePerson(personId)

  return (
    <div className="space-y-6">
      <Link
        to="/people"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={BackIcon} className="size-4" />
        Back to members
      </Link>

      {!isFirebaseConfigured ? (
        <ErrorState
          title="Connect Firebase to view people"
          description="Set the VITE_FIREBASE_* variables in .env to load member profiles."
        />
      ) : query.isLoading ? (
        <LoadingState label="Loading profile…" />
      ) : query.isError ? (
        <ErrorState
          title="Couldn’t load this profile"
          description={
            query.error instanceof Error ? query.error.message : undefined
          }
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : !query.data ? (
        <EmptyState
          icon={<HugeiconsIcon icon={MembersIcon} className="size-8" />}
          title="Person not found"
          description="This person may have been removed."
        />
      ) : (
        <ProfileView
          person={query.data}
          canWrite={canWrite}
          canSeeSensitive={canSeeSensitive}
          onEdit={() => setEditing(true)}
        />
      )}

      {query.data ? (
        <PersonFormDialog
          open={editing}
          person={query.data}
          onOpenChange={setEditing}
        />
      ) : null}
    </div>
  )
}

function ProfileView({
  person,
  canWrite,
  canSeeSensitive,
  onEdit,
}: {
  person: Person
  canWrite: boolean
  canSeeSensitive: boolean
  onEdit: () => void
}) {
  const age = ageFromDob(person.dateOfBirth)
  const address = [
    person.addressLine1,
    person.addressLine2,
    person.city,
    person.postcode,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white">
            {initials(person.firstName, person.lastName)}
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {displayName(person)}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <MembershipBadge status={person.membershipStatus} />
              {person.membershipDate ? (
                <span className="text-sm text-muted-foreground">
                  Member since {formatDate(person.membershipDate)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        {canWrite ? (
          <Button variant="outline" onClick={onEdit}>
            <HugeiconsIcon icon={EditIcon} />
            Edit
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Contact — sensitive */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {canSeeSensitive ? (
              <>
                <InfoRow icon={PhoneIcon} label="Phone" value={person.phone} />
                <InfoRow icon={MailIcon} label="Email" value={person.email} />
                <InfoRow
                  icon={LocationIcon}
                  label="Address"
                  value={address || null}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                You don’t have permission to view contact details.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Personal */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              icon={CalendarIcon}
              label="Date of birth"
              value={
                person.dateOfBirth
                  ? `${formatDate(person.dateOfBirth)}${age !== null ? ` (${age})` : ''}`
                  : null
              }
            />
            <TextRow
              label="Gender"
              value={
                person.gender ? genderLabels[person.gender as Gender] : null
              }
            />
            <TextRow
              label="Marital status"
              value={
                person.maritalStatus
                  ? maritalStatusLabels[person.maritalStatus as MaritalStatus]
                  : null
              }
            />
            <InfoRow
              icon={CalendarIcon}
              label="Marriage anniversary"
              value={
                person.marriageDate ? formatDate(person.marriageDate) : null
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Notes — sensitive */}
      {canSeeSensitive && person.notes ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-foreground">
              {person.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Related data — Ministries is live (Phase 3); the rest come later. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PersonMinistries personId={person.id} />
        <PersonAttendance personId={person.id} />
        <FutureCard title="Family" phase="Phase 2+" />
      </div>
    </>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: IconSvgElement
  label: string
  value?: string | null
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <HugeiconsIcon icon={icon} className="size-4" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value ?? '—'}</p>
      </div>
    </div>
  )
}

function TextRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value ?? '—'}</span>
    </div>
  )
}

function FutureCard({
  title,
  phase,
}: {
  title: string
  phase: string
}): ReactNode {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Coming in {phase}.</p>
      </CardContent>
    </Card>
  )
}
