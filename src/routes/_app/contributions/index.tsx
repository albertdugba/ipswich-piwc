import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { requirePermission } from '@/lib/auth/route-guards'
import { hasPermission } from '@/lib/auth/permissions'
import { isFirebaseConfigured } from '@/lib/env.public'
import { useFunds } from '@/features/contributions/queries'
import { FundFormDialog } from '@/features/contributions/FundFormDialog'
import { useDepartments } from '@/features/ministries/queries'
import { usePeople } from '@/features/people/queries'
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
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
  ContributionIcon,
  HugeiconsIcon,
  MembersIcon,
} from '@/lib/icons'
import {
  contributionKindLabels,
  contributionKindValues,
  type ContributionKind,
} from '@/domain/enums'
import {
  penceToPounds,
  progressPct,
  type ContributionFund,
} from '@/domain/contribution'
import { displayName, formatDate, formatGBP } from '@/lib/utils'

const NO_FUNDS: ContributionFund[] = []

export const Route = createFileRoute('/_app/contributions/')({
  beforeLoad: ({ context }) =>
    requirePermission(context.user, 'contributions:read'),
  component: ContributionsPage,
})

type KindFilter = ContributionKind | 'ALL'
type StateFilter = 'ALL' | 'OPEN' | 'CLOSED'

function ContributionsPage() {
  const { user } = Route.useRouteContext()
  const canWrite = hasPermission(user.role, 'contributions:write')
  const canSeeAmounts = hasPermission(user.role, 'contributions:read_amounts')

  const [kind, setKind] = useState<KindFilter>('ALL')
  const [state, setState] = useState<StateFilter>('OPEN')
  const [dialog, setDialog] = useState(false)

  const query = useFunds()
  const departmentsQuery = useDepartments()
  const peopleQuery = usePeople()

  const funds = query.data ?? NO_FUNDS
  const filtered = useMemo(
    () =>
      funds.filter((f) => {
        if (kind !== 'ALL' && f.kind !== kind) return false
        if (state === 'OPEN' && !f.isOpen) return false
        if (state === 'CLOSED' && f.isOpen) return false
        return true
      }),
    [funds, kind, state],
  )

  const openFunds = funds.filter((f) => f.isOpen)
  const raisedThisView = filtered.reduce((sum, f) => sum + f.totalAmount, 0)

  const departmentName = (id?: string | null) =>
    departmentsQuery.data?.find((d) => d.id === id)?.name ?? null
  const beneficiaryName = (id?: string | null) => {
    const p = peopleQuery.data?.find((x) => x.id === id)
    return p ? displayName(p) : null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contributions"
        description="Dues, bereavement support and special collections — who has given, and how much."
        actions={
          canWrite && isFirebaseConfigured ? (
            <Button onClick={() => setDialog(true)}>
              <HugeiconsIcon icon={AddIcon} />
              New collection
            </Button>
          ) : undefined
        }
      />

      {!isFirebaseConfigured ? (
        <ErrorState
          title="Connect Firebase to track contributions"
          description="Set the VITE_FIREBASE_* variables in .env (or run the Firebase emulator) so contributions can be read and written."
        />
      ) : query.isLoading ? (
        <LoadingState label="Loading collections…" />
      ) : query.isError ? (
        <ErrorState
          title="Couldn’t load collections"
          description={
            query.error instanceof Error ? query.error.message : undefined
          }
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : funds.length === 0 ? (
        <EmptyState
          icon={<HugeiconsIcon icon={ContributionIcon} className="size-8" />}
          title="No collections yet"
          description="Start with this month's dues, or a bereavement collection when someone needs support."
          action={
            canWrite ? (
              <Button onClick={() => setDialog(true)}>
                <HugeiconsIcon icon={AddIcon} />
                New collection
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {canSeeAmounts ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Open collections"
                value={openFunds.length}
                icon={ContributionIcon}
              />
              <StatCard
                label="Total raised"
                value={formatGBP(penceToPounds(raisedThisView))}
                hint="Across the collections shown below."
              />
              <StatCard
                label="Contributors"
                value={filtered.reduce((s, f) => s + f.contributorCount, 0)}
                icon={MembersIcon}
                hint="Counted once per collection."
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={state}
              onValueChange={(v) => setState((v as StateFilter) ?? 'ALL')}
            >
              <SelectTrigger className="w-36">
                <SelectValue>
                  {(v: string | null) =>
                    v === 'OPEN'
                      ? 'Open'
                      : v === 'CLOSED'
                        ? 'Closed'
                        : 'All states'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="ALL">All states</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={kind}
              onValueChange={(v) => setKind((v as KindFilter) ?? 'ALL')}
            >
              <SelectTrigger className="w-48">
                <SelectValue>
                  {(v: string | null) =>
                    v && v !== 'ALL'
                      ? contributionKindLabels[v as ContributionKind]
                      : 'All types'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="ALL">All types</SelectItem>
                {contributionKindValues.map((k) => (
                  <SelectItem key={k} value={k}>
                    {contributionKindLabels[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={
                <HugeiconsIcon icon={ContributionIcon} className="size-8" />
              }
              title="Nothing matches these filters"
              description="Try showing all states or all types."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((fund) => (
                <FundCard
                  key={fund.id}
                  fund={fund}
                  canSeeAmounts={canSeeAmounts}
                  subtitle={
                    fund.kind === 'MINISTRY_DUES'
                      ? departmentName(fund.departmentId)
                      : fund.kind === 'BEREAVEMENT'
                        ? beneficiaryName(fund.beneficiaryPersonId)
                        : null
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      <FundFormDialog open={dialog} onOpenChange={setDialog} />
    </div>
  )
}

const kindTone: Record<ContributionKind, string> = {
  MONTHLY_DUES: 'bg-brand-50 text-brand-700',
  MINISTRY_DUES: 'bg-brand-50 text-brand-700',
  BEREAVEMENT: 'bg-gold-50 text-gold-700',
  SPECIAL: 'bg-muted text-muted-foreground',
}

function FundCard({
  fund,
  canSeeAmounts,
  subtitle,
}: {
  fund: ContributionFund
  canSeeAmounts: boolean
  subtitle: string | null
}) {
  const pct = progressPct(fund.totalAmount, fund.targetAmount)

  return (
    <Link
      to="/contributions/$fundId"
      params={{ fundId: fund.id }}
      className="group flex h-full flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm hover:ring-brand-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${kindTone[fund.kind]}`}
        >
          {contributionKindLabels[fund.kind]}
        </span>
        {fund.isOpen ? null : <Badge variant="secondary">Closed</Badge>}
      </div>

      <h3 className="mt-3 font-semibold text-foreground">{fund.name}</h3>
      {subtitle ? (
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {subtitle}
        </p>
      ) : null}

      <div className="mt-4 flex-1">
        {fund.periodStart || fund.periodEnd ? (
          <p className="text-xs text-muted-foreground">
            {fund.periodStart ? formatDate(fund.periodStart) : '—'}
            {fund.periodEnd ? ` → ${formatDate(fund.periodEnd)}` : ''}
          </p>
        ) : null}
      </div>

      <div className="mt-4 border-t border-border/60 pt-3">
        {canSeeAmounts ? (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {formatGBP(penceToPounds(fund.totalAmount))}
              </span>
              {fund.targetAmount ? (
                <span className="text-xs text-muted-foreground tabular-nums">
                  of {formatGBP(penceToPounds(fund.targetAmount))}
                </span>
              ) : null}
            </div>
            {pct !== null ? (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-600 transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : null}
          </>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          {fund.contributorCount}{' '}
          {fund.contributorCount === 1 ? 'contributor' : 'contributors'}
        </p>
      </div>
    </Link>
  )
}
