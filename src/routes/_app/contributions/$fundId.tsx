import { useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth/route-guards'
import { hasPermission } from '@/lib/auth/permissions'
import { isFirebaseConfigured } from '@/lib/env.public'
import {
  useDeleteFund,
  useDeleteRecord,
  useFund,
  useFundRecords,
} from '@/features/contributions/queries'
import { useAllMemberships } from '@/features/ministries/queries'
import { usePeople } from '@/features/people/queries'
import { FundFormDialog } from '@/features/contributions/FundFormDialog'
import { RecordContributionDialog } from '@/features/contributions/RecordContributionDialog'
import { ContributorRoster } from '@/features/contributions/ContributorRoster'
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AddIcon,
  AlertIcon,
  BackIcon,
  ContributionIcon,
  DeleteIcon,
  EditIcon,
  HugeiconsIcon,
  MoreIcon,
  StarIcon,
} from '@/lib/icons'
import { contributionKindLabels, type ContributionKind } from '@/domain/enums'
import {
  penceToPounds,
  progressPct,
  summariseFund,
  tracksDues,
  type ContributionRecord,
} from '@/domain/contribution'
import { displayName, formatDate, formatGBP } from '@/lib/utils'
import type { Person } from '@/domain/person'

export const Route = createFileRoute('/_app/contributions/$fundId')({
  beforeLoad: ({ context }) =>
    requirePermission(context.user, 'contributions:read'),
  component: FundDetailPage,
})

const NO_PEOPLE: Person[] = []
const NO_RECORDS: ContributionRecord[] = []

function FundDetailPage() {
  const { fundId } = Route.useParams()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const canWrite = hasPermission(user.role, 'contributions:write')
  const canSeeAmounts = hasPermission(user.role, 'contributions:read_amounts')

  const fundQuery = useFund(fundId)
  const recordsQuery = useFundRecords(fundId)
  const peopleQuery = usePeople()
  const membershipsQuery = useAllMemberships()
  const deleteFund = useDeleteFund()
  const deleteRecord = useDeleteRecord()

  const [editing, setEditing] = useState(false)
  const [recording, setRecording] = useState<{
    open: boolean
    person?: Person
  }>({ open: false })

  const fund = fundQuery.data ?? null
  const records = recordsQuery.data ?? NO_RECORDS
  const allPeople = peopleQuery.data ?? NO_PEOPLE

  const eligible = useMemo(() => {
    if (!fund?.departmentId) return allPeople
    const ids = new Set(
      (membershipsQuery.data ?? [])
        .filter((m) => m.departmentId === fund.departmentId)
        .map((m) => m.personId),
    )
    return allPeople.filter((p) => ids.has(p.id))
  }, [fund?.departmentId, allPeople, membershipsQuery.data])

  const summary = useMemo(
    () =>
      summariseFund(
        { expectedPerPerson: fund?.expectedPerPerson ?? null },
        records,
        eligible.map((p) => p.id),
      ),
    [fund?.expectedPerPerson, records, eligible],
  )

  const beneficiary = allPeople.find((p) => p.id === fund?.beneficiaryPersonId)
  const expected = fund?.expectedPerPerson ?? 0

  function handleDeleteFund() {
    if (!fund) return
    const ok = window.confirm(
      `Delete “${fund.name}”? This also deletes its ${summary.paymentCount} recorded contribution(s).`,
    )
    if (!ok) return
    deleteFund.mutate(fundId, {
      onSuccess: () => navigate({ to: '/contributions' }),
    })
  }

  const loading = fundQuery.isLoading || peopleQuery.isLoading

  return (
    <div className="space-y-6">
      <Link
        to="/contributions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={BackIcon} className="size-4" />
        Back to contributions
      </Link>

      {!isFirebaseConfigured ? (
        <ErrorState
          title="Connect Firebase to view contributions"
          description="Set the VITE_FIREBASE_* variables in .env to load this collection."
        />
      ) : fundQuery.isError ? (
        <ErrorState
          title="Couldn’t load this collection"
          action={
            <Button variant="outline" onClick={() => fundQuery.refetch()}>
              Try again
            </Button>
          }
        />
      ) : loading ? (
        <LoadingState label="Loading collection…" />
      ) : !fund ? (
        <EmptyState
          icon={<HugeiconsIcon icon={ContributionIcon} className="size-8" />}
          title="Collection not found"
          description="It may have been removed."
        />
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white ring-2 ring-gold-400"
              >
                <HugeiconsIcon icon={ContributionIcon} className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
                    {fund.name}
                  </h1>
                  <Badge variant="secondary">
                    {contributionKindLabels[fund.kind as ContributionKind]}
                  </Badge>
                  {fund.isOpen ? null : <Badge>Closed</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {fund.periodStart || fund.periodEnd
                    ? `${fund.periodStart ? formatDate(fund.periodStart) : '—'}${
                        fund.periodEnd ? ` → ${formatDate(fund.periodEnd)}` : ''
                      }`
                    : 'No dates set'}
                </p>
              </div>
            </div>
            {canWrite ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="icon" />}
                  aria-label="Collection options"
                >
                  <HugeiconsIcon icon={MoreIcon} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditing(true)}>
                    <HugeiconsIcon icon={EditIcon} />
                    Edit collection
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={deleteFund.isPending}
                    onClick={handleDeleteFund}
                  >
                    <HugeiconsIcon icon={DeleteIcon} />
                    Delete collection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          {fund.kind === 'BEREAVEMENT' && beneficiary ? (
            <div className="flex items-center gap-3 rounded-xl bg-gold-50 p-4 ring-1 ring-gold-200">
              <HugeiconsIcon
                icon={StarIcon}
                className="size-5 shrink-0 text-gold-700"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Supporting{' '}
                  <Link
                    to="/people/$personId"
                    params={{ personId: beneficiary.id }}
                    className="underline underline-offset-2"
                  >
                    {displayName(beneficiary)}
                  </Link>
                </p>
                {fund.beneficiaryNote ? (
                  <p className="text-sm text-muted-foreground">
                    In memory of {fund.beneficiaryNote}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {canSeeAmounts ? (
              <Stat
                label="Raised"
                value={formatGBP(penceToPounds(summary.total))}
                emphasis
              />
            ) : null}
            <Stat
              label="Contributors"
              value={`${summary.rosterContributorCount} / ${summary.rosterSize}`}
            />
            {canSeeAmounts && fund.targetAmount ? (
              <Stat
                label="Target"
                value={formatGBP(penceToPounds(fund.targetAmount))}
              />
            ) : null}
            {canSeeAmounts && summary.outstanding !== null ? (
              <Stat
                label="Outstanding"
                value={formatGBP(penceToPounds(summary.outstanding))}
                hint={`${formatGBP(penceToPounds(expected))} expected from each of ${summary.rosterSize}`}
              />
            ) : null}
            <Stat label="Payments" value={summary.paymentCount} />
          </div>

          {canSeeAmounts &&
          progressPct(summary.total, fund.targetAmount) !== null ? (
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-600 transition-[width] duration-500"
                  style={{
                    width: `${progressPct(summary.total, fund.targetAmount)}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                {progressPct(summary.total, fund.targetAmount)}% of{' '}
                {formatGBP(penceToPounds(fund.targetAmount))}
              </p>
            </div>
          ) : null}

          {summary.offRoster.count > 0 ? (
            <p className="flex items-start gap-2 rounded-xl bg-gold-50 px-4 py-3 text-sm text-foreground ring-1 ring-gold-200">
              <HugeiconsIcon
                icon={AlertIcon}
                className="mt-0.5 size-4 shrink-0 text-gold-700"
              />
              <span>
                {summary.offRoster.count}{' '}
                {summary.offRoster.count === 1
                  ? 'contributor is'
                  : 'contributors are'}{' '}
                no longer on this roster
                {canSeeAmounts
                  ? ` (${formatGBP(penceToPounds(summary.offRoster.total))})`
                  : ''}
                . Their giving is included in the total above but not listed
                below.
              </span>
            </p>
          ) : null}

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-medium text-foreground">
                {tracksDues(fund) ? 'Who has paid' : 'Contributors'}
              </h2>
              {canWrite && fund.isOpen ? (
                <Button onClick={() => setRecording({ open: true })}>
                  <HugeiconsIcon icon={AddIcon} />
                  Record contribution
                </Button>
              ) : null}
            </div>

            <ContributorRoster
              people={eligible}
              records={records}
              givenByPerson={summary.givenByPerson}
              expectedPerPerson={tracksDues(fund) ? expected : null}
              canSeeAmounts={canSeeAmounts}
              canWrite={canWrite && fund.isOpen}
              isLoading={recordsQuery.isLoading}
              onRecordFor={(person) => setRecording({ open: true, person })}
              onDeleteRecord={(recordId) =>
                deleteRecord.mutate({ recordId, fundId })
              }
            />
          </div>
        </>
      )}

      {fund ? (
        <FundFormDialog open={editing} fund={fund} onOpenChange={setEditing} />
      ) : null}
      <RecordContributionDialog
        open={recording.open}
        onOpenChange={(open) => setRecording((r) => ({ ...r, open }))}
        fundId={fundId}
        people={eligible}
        person={recording.person}
        recordedById={user.id}
      />
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string
  value: string | number
  hint?: string
  emphasis?: boolean
}) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={
          emphasis
            ? 'mt-1 text-xl font-semibold text-brand-700 tabular-nums'
            : 'mt-1 text-xl font-semibold text-foreground tabular-nums'
        }
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
