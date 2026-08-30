import { useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PersonCombobox } from '@/features/people/PersonCombobox'
import { useCreateRecord, useUpdateRecord } from './queries'
import {
  contributionRecordFormSchema,
  penceToPounds,
  todayIso,
  type ContributionRecord,
  type ContributionRecordFormInput,
  type ContributionRecordFormValues,
} from '@/domain/contribution'
import {
  paymentMethodLabels,
  paymentMethodValues,
  type PaymentMethod,
} from '@/domain/enums'
import { AlertIcon, HugeiconsIcon } from '@/lib/icons'
import type { Person } from '@/domain/person'

/*
 * Record (or edit) one contribution against a fund. A person may appear here
 * more than once — instalments and repeat giving are both normal, so this
 * always creates a new record rather than replacing a person's previous one.
 */
export function RecordContributionDialog({
  open,
  onOpenChange,
  fundId,
  people,
  record,
  /** Preselected contributor, e.g. when opened from a roster row. */
  person,
  recordedById,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  fundId: string
  people: Person[]
  record?: ContributionRecord
  person?: Person
  recordedById?: string | null
}) {
  const create = useCreateRecord()
  const update = useUpdateRecord()
  const submitting = create.isPending || update.isPending
  const error = create.error ?? update.error

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<
    ContributionRecordFormInput,
    unknown,
    ContributionRecordFormValues
  >({
    resolver: zodResolver(contributionRecordFormSchema),
    defaultValues: {
      personId: record?.personId ?? person?.id ?? '',
      amount: record ? String(penceToPounds(record.amount)) : '',
      contributedOn: record?.contributedOn ?? todayIso(),
      method: record?.method ?? 'CASH',
      note: record?.note ?? '',
    },
    mode: 'onTouched',
  })

  // Start each visit from a clean slate rather than the last attempt's values.
  useEffect(() => {
    if (!open) return
    reset({
      personId: record?.personId ?? person?.id ?? '',
      amount: record ? String(penceToPounds(record.amount)) : '',
      contributedOn: record?.contributedOn ?? todayIso(),
      method: record?.method ?? 'CASH',
      note: record?.note ?? '',
    })
  }, [open, record, person, reset])

  function onSubmit(values: ContributionRecordFormValues) {
    if (record) {
      update.mutate(
        { recordId: record.id, fundId, values },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      create.mutate(
        { fundId, values, recordedById },
        { onSuccess: () => onOpenChange(false) },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {record ? 'Edit contribution' : 'Record a contribution'}
          </DialogTitle>
          <DialogDescription>
            {record
              ? 'Correct the amount, date or method.'
              : 'Each payment is recorded separately, so instalments are fine.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <DialogBody className="space-y-4">
            <Field label="Who" required error={errors.personId?.message}>
              <Controller
                control={control}
                name="personId"
                render={({ field, fieldState }) => (
                  <PersonCombobox
                    people={people}
                    value={people.find((p) => p.id === field.value) ?? null}
                    onValueChange={(p) => field.onChange(p?.id ?? '')}
                    invalid={Boolean(fieldState.error)}
                    disabled={Boolean(person)}
                  />
                )}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Amount" required error={errors.amount?.message}>
                <div className="relative">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
                  >
                    £
                  </span>
                  <Input
                    {...register('amount')}
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    autoFocus
                    className="pl-7"
                    aria-invalid={Boolean(errors.amount)}
                  />
                </div>
              </Field>
              <Field
                label="Date"
                required
                error={errors.contributedOn?.message}
              >
                <Input
                  type="date"
                  {...register('contributedOn')}
                  aria-invalid={Boolean(errors.contributedOn)}
                />
              </Field>
            </div>

            <Field label="Method" error={errors.method?.message}>
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'CASH'}
                    onValueChange={(v) =>
                      field.onChange((v as PaymentMethod) ?? 'CASH')
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v: string | null) =>
                          v
                            ? paymentMethodLabels[v as PaymentMethod]
                            : 'Choose a method'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {paymentMethodValues.map((m) => (
                        <SelectItem key={m} value={m}>
                          {paymentMethodLabels[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Note" error={errors.note?.message}>
              <Textarea
                {...register('note')}
                rows={2}
                placeholder="Optional — e.g. handed to the treasurer"
              />
            </Field>

            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <HugeiconsIcon
                  icon={AlertIcon}
                  className="mt-0.5 size-4 shrink-0"
                />
                {error instanceof Error
                  ? error.message
                  : 'Could not save this contribution.'}
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : record ? 'Save changes' : 'Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
