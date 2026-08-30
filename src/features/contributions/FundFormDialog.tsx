import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PersonCombobox } from '@/features/people/PersonCombobox'
import { usePeople } from '@/features/people/queries'
import { useDepartments } from '@/features/ministries/queries'
import { useCreateFund, useUpdateFund } from './queries'
import {
  contributionFundFormSchema,
  penceToPounds,
  type ContributionFund,
  type ContributionFundFormInput,
  type ContributionFundFormValues,
} from '@/domain/contribution'
import {
  contributionKindHints,
  contributionKindLabels,
  contributionKindValues,
  type ContributionKind,
} from '@/domain/enums'

/*
 * Create / edit a contribution fund. The form is one shape with conditional
 * fields rather than four separate forms: `kind` decides which extra field is
 * required, and the Zod schema enforces that (a MINISTRY_DUES fund without a
 * department, or a BEREAVEMENT without a beneficiary, will not validate).
 *
 * Money is typed in pounds and stored in pence — the schema does the conversion,
 * so nothing here deals in floats.
 */

/** Money fields round-trip through pounds for editing. */
function poundsField(pence?: number | null) {
  return pence ? String(penceToPounds(pence)) : ''
}

export function FundFormDialog({
  open,
  onOpenChange,
  fund,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  fund?: ContributionFund
  onCreated?: (id: string) => void
}) {
  const isEdit = Boolean(fund)
  const create = useCreateFund()
  const update = useUpdateFund()
  const submitting = create.isPending || update.isPending

  function handleSubmit(values: ContributionFundFormValues) {
    if (fund) {
      update.mutate(
        { id: fund.id, values },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      create.mutate(values, {
        onSuccess: (id) => {
          onOpenChange(false)
          onCreated?.(id)
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit collection' : 'New collection'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this collection’s details.'
              : 'Dues, a bereavement collection or a one-off appeal.'}
          </DialogDescription>
        </DialogHeader>
        {/* Remount on target change so the form resets its state. */}
        <FundForm
          key={fund?.id ?? 'new'}
          fund={fund}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function FundForm({
  fund,
  submitting,
  onSubmit,
  onCancel,
}: {
  fund?: ContributionFund
  submitting: boolean
  onSubmit: (values: ContributionFundFormValues) => void
  onCancel: () => void
}) {
  const peopleQuery = usePeople()
  const departmentsQuery = useDepartments()
  const people = peopleQuery.data ?? []
  const departments = departmentsQuery.data ?? []

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContributionFundFormInput, unknown, ContributionFundFormValues>({
    resolver: zodResolver(contributionFundFormSchema),
    defaultValues: {
      name: fund?.name ?? '',
      kind: fund?.kind ?? 'SPECIAL',
      departmentId: fund?.departmentId ?? '',
      beneficiaryPersonId: fund?.beneficiaryPersonId ?? '',
      beneficiaryNote: fund?.beneficiaryNote ?? '',
      expectedPerPerson: poundsField(fund?.expectedPerPerson),
      targetAmount: poundsField(fund?.targetAmount),
      periodStart: fund?.periodStart ?? '',
      periodEnd: fund?.periodEnd ?? '',
      isOpen: fund?.isOpen ?? true,
      notes: fund?.notes ?? '',
    },
    mode: 'onTouched',
  })

  const kind = watch('kind') as ContributionKind
  const isDues = kind === 'MONTHLY_DUES' || kind === 'MINISTRY_DUES'

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <DialogBody className="space-y-4">
        <Field label="What is it for" required error={errors.kind?.message}>
          <Controller
            control={control}
            name="kind"
            render={({ field }) => (
              <Select
                value={field.value ?? 'SPECIAL'}
                onValueChange={(v) =>
                  field.onChange((v as ContributionKind) ?? 'SPECIAL')
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: string | null) =>
                      v
                        ? contributionKindLabels[v as ContributionKind]
                        : 'Choose a type'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {contributionKindValues.map((k) => (
                    <SelectItem key={k} value={k} className="py-2">
                      <span className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground">
                          {contributionKindLabels[k]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {contributionKindHints[k]}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label="Name" required error={errors.name?.message}>
          <Input
            {...register('name')}
            placeholder={
              kind === 'BEREAVEMENT'
                ? 'e.g. Bereavement support — Ama Mensah'
                : kind === 'MONTHLY_DUES'
                  ? 'e.g. October 2026 dues'
                  : 'e.g. Harvest appeal'
            }
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

        {/* Ministry dues restrict the roster to that ministry's members. */}
        {kind === 'MINISTRY_DUES' ? (
          <Field
            label="Ministry"
            required
            error={errors.departmentId?.message}
            hint="Only this ministry's members will be listed."
          >
            <Controller
              control={control}
              name="departmentId"
              render={({ field }) => (
                <Select
                  value={field.value || null}
                  onValueChange={(v) =>
                    field.onChange((v as string | null) ?? '')
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v: string | null) =>
                        departments.find((d) => d.id === v)?.name ??
                        'Choose a ministry'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        ) : null}

        {kind === 'BEREAVEMENT' ? (
          <>
            <Field
              label="Member being supported"
              required
              error={errors.beneficiaryPersonId?.message}
            >
              <Controller
                control={control}
                name="beneficiaryPersonId"
                render={({ field, fieldState }) => (
                  <PersonCombobox
                    people={people}
                    value={people.find((p) => p.id === field.value) ?? null}
                    onValueChange={(p) => field.onChange(p?.id ?? '')}
                    invalid={Boolean(fieldState.error)}
                  />
                )}
              />
            </Field>
            <Field
              label="In memory of"
              error={errors.beneficiaryNote?.message}
              hint="The person who died is usually not in the directory, so record them here."
            >
              <Input
                {...register('beneficiaryNote')}
                placeholder="e.g. mother, Grace Mensah"
              />
            </Field>
          </>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isDues ? (
            <Field
              label="Expected per member"
              error={errors.expectedPerPerson?.message}
              hint="Drives the paid / part-paid / unpaid list."
            >
              <MoneyInput
                {...register('expectedPerPerson')}
                aria-invalid={Boolean(errors.expectedPerPerson)}
              />
            </Field>
          ) : null}
          <Field
            label="Target"
            error={errors.targetAmount?.message}
            hint="Optional fundraising goal."
          >
            <MoneyInput
              {...register('targetAmount')}
              aria-invalid={Boolean(errors.targetAmount)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="From" error={errors.periodStart?.message}>
            <Input
              type="date"
              {...register('periodStart')}
              aria-invalid={Boolean(errors.periodStart)}
            />
          </Field>
          <Field label="To" error={errors.periodEnd?.message}>
            <Input
              type="date"
              {...register('periodEnd')}
              aria-invalid={Boolean(errors.periodEnd)}
            />
          </Field>
        </div>

        <Field label="Notes" error={errors.notes?.message}>
          <Textarea {...register('notes')} rows={2} />
        </Field>

        <Controller
          control={control}
          name="isOpen"
          render={({ field }) => (
            <button
              type="button"
              onClick={() => field.onChange(!field.value)}
              className="flex w-fit items-center gap-2 text-sm text-foreground"
            >
              <Checkbox
                checked={field.value}
                aria-hidden
                tabIndex={-1}
                className="pointer-events-none"
              />
              Open for contributions
            </button>
          )}
        />
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : fund ? 'Save changes' : 'Create collection'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Pounds input with a £ adornment. Values are converted to pence by the schema. */
function MoneyInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
      >
        £
      </span>
      <Input
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        className={`pl-7 ${className ?? ''}`}
        {...props}
      />
    </div>
  )
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
