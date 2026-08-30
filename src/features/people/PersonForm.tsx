import { useState } from 'react'
import { Controller, useForm, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  genderLabels,
  genderValues,
  maritalStatusLabels,
  maritalStatusValues,
  membershipStatusLabels,
  membershipStatusValues,
} from '@/domain/enums'
import {
  emptyPersonForm,
  personFormSchema,
  type PersonFormInput,
  type PersonFormValues,
} from '@/domain/person'
import type { Person } from '@/domain/person'
import { Input } from '@/components/ui/input'
import { Field, FieldGrid } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DialogBody, DialogFooter } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HugeiconsIcon, LocationIcon } from '@/lib/icons'
import { lookupPostcode } from '@/lib/postcode'
import { cn } from '@/lib/utils'

function toDefaults(person?: Person): PersonFormInput {
  return {
    firstName: person?.firstName ?? '',
    lastName: person?.lastName ?? '',
    preferredName: person?.preferredName ?? '',
    gender: person?.gender ?? undefined,
    dateOfBirth: person?.dateOfBirth ?? '',
    phone: person?.phone ?? '',
    email: person?.email ?? '',
    addressLine1: person?.addressLine1 ?? '',
    addressLine2: person?.addressLine2 ?? '',
    city: person?.city ?? '',
    postcode: person?.postcode ?? '',
    membershipStatus:
      person?.membershipStatus ?? emptyPersonForm.membershipStatus,
    firstAttendedOn: person?.firstAttendedOn ?? '',
    membershipDate: person?.membershipDate ?? '',
    maritalStatus: person?.maritalStatus ?? undefined,
    marriageDate: person?.marriageDate ?? '',
    notes: person?.notes ?? '',
    isActive: person?.isActive ?? true,
  }
}

export function PersonForm({
  person,
  submitting,
  submitLabel = 'Save',
  error,
  onSubmit,
  onCancel,
}: {
  person?: Person
  submitting?: boolean
  submitLabel?: string
  error?: string | null
  onSubmit: (values: PersonFormValues) => void
  onCancel: () => void
}) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PersonFormInput, unknown, PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: toDefaults(person),
    mode: 'onTouched',
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <DialogBody className="space-y-5">
        <FieldGrid>
          <Field label="First name" required error={errors.firstName?.message}>
            <Input
              {...register('firstName')}
              autoComplete="given-name"
              aria-invalid={Boolean(errors.firstName)}
            />
          </Field>
          <Field label="Last name" required error={errors.lastName?.message}>
            <Input
              {...register('lastName')}
              autoComplete="family-name"
              aria-invalid={Boolean(errors.lastName)}
            />
          </Field>
          <Field label="Preferred name" error={errors.preferredName?.message}>
            <Input {...register('preferredName')} />
          </Field>
          <Field label="Gender" error={errors.gender?.message}>
            <EnumSelect
              control={control}
              name="gender"
              placeholder="Select gender"
              options={genderValues.map((v) => ({
                value: v,
                label: genderLabels[v],
              }))}
            />
          </Field>
        </FieldGrid>

        <FieldGrid>
          <Field
            label="Membership status"
            required
            error={errors.membershipStatus?.message}
          >
            <EnumSelect
              control={control}
              name="membershipStatus"
              placeholder="Select status"
              options={membershipStatusValues.map((v) => ({
                value: v,
                label: membershipStatusLabels[v],
              }))}
            />
          </Field>
          <Field label="Date of birth" error={errors.dateOfBirth?.message}>
            <Input
              type="date"
              {...register('dateOfBirth')}
              aria-invalid={Boolean(errors.dateOfBirth)}
            />
          </Field>
        </FieldGrid>

        <FieldGrid>
          <Field label="Phone" error={errors.phone?.message}>
            <Input type="tel" {...register('phone')} autoComplete="tel" />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input
              type="email"
              {...register('email')}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
            />
          </Field>
        </FieldGrid>

        <FieldGrid>
          <Field label="Marital status" error={errors.maritalStatus?.message}>
            <EnumSelect
              control={control}
              name="maritalStatus"
              placeholder="Select marital status"
              options={maritalStatusValues.map((v) => ({
                value: v,
                label: maritalStatusLabels[v],
              }))}
            />
          </Field>
          <Field label="Marriage date" error={errors.marriageDate?.message}>
            <Input
              type="date"
              {...register('marriageDate')}
              aria-invalid={Boolean(errors.marriageDate)}
            />
          </Field>
        </FieldGrid>

        <Controller
          control={control}
          name="postcode"
          render={({ field }) => (
            <PostcodeLookup
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              onResolved={({ town }) => {
                if (town) setValue('city', town, { shouldDirty: true })
              }}
              error={errors.postcode?.message}
            />
          )}
        />
        <Field label="Address line 1" error={errors.addressLine1?.message}>
          <Input
            {...register('addressLine1')}
            placeholder="House number and street"
            autoComplete="address-line1"
          />
        </Field>
        <FieldGrid>
          <Field label="Address line 2" error={errors.addressLine2?.message}>
            <Input {...register('addressLine2')} autoComplete="address-line2" />
          </Field>
          <Field label="Town / city" error={errors.city?.message}>
            <Input {...register('city')} autoComplete="address-level2" />
          </Field>
        </FieldGrid>

        <FieldGrid>
          <Field label="First attended" error={errors.firstAttendedOn?.message}>
            <Input
              type="date"
              {...register('firstAttendedOn')}
              aria-invalid={Boolean(errors.firstAttendedOn)}
            />
          </Field>
          <Field label="Membership date" error={errors.membershipDate?.message}>
            <Input
              type="date"
              {...register('membershipDate')}
              aria-invalid={Boolean(errors.membershipDate)}
            />
          </Field>
        </FieldGrid>

        <Field label="Notes" error={errors.notes?.message}>
          <Textarea {...register('notes')} rows={3} />
        </Field>

        <Controller
          control={control}
          name="isActive"
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
              Active
            </button>
          )}
        />

        {error ? (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

function EnumSelect<
  Name extends 'gender' | 'maritalStatus' | 'membershipStatus',
>({
  control,
  name,
  placeholder,
  options,
}: {
  control: Control<PersonFormInput, unknown, PersonFormValues>
  name: Name
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Select
          value={field.value ?? null}
          onValueChange={(v) =>
            field.onChange((v as string | null) ?? undefined)
          }
        >
          <SelectTrigger
            className={cn('w-full', !field.value && 'text-muted-foreground')}
            aria-invalid={Boolean(fieldState.error)}
            onBlur={field.onBlur}
          >
            <SelectValue>
              {(v: string | null) =>
                v
                  ? (options.find((o) => o.value === v)?.label ?? v)
                  : placeholder
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )
}

function PostcodeLookup({
  value,
  onChange,
  onBlur,
  onResolved,
  error,
}: {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  onResolved: (result: { town: string | null }) => void
  error?: string
}) {
  const [looking, setLooking] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(
    null,
  )

  async function run() {
    if (!value.trim() || looking) return
    setLooking(true)
    setStatus(null)
    try {
      const result = await lookupPostcode(value)
      if (!result) {
        setStatus({
          ok: false,
          text: 'Postcode not found — check it or enter the address manually.',
        })
        return
      }
      onChange(result.postcode)
      onResolved({ town: result.town })
      const where = [result.town, result.region].filter(Boolean).join(', ')
      setStatus({
        ok: true,
        text: where
          ? `Found: ${where} — town filled in. Now add the house number & street.`
          : 'Postcode valid. Now add the house number & street.',
      })
    } catch (e) {
      setStatus({
        ok: false,
        text: e instanceof Error ? e.message : 'Lookup failed.',
      })
    } finally {
      setLooking(false)
    }
  }

  return (
    <Field label="Postcode" error={error}>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void run()
            }
          }}
          placeholder="e.g. IP1 1AA"
          autoComplete="postal-code"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void run()}
          disabled={looking || !value.trim()}
        >
          <HugeiconsIcon icon={LocationIcon} />
          {looking ? 'Searching…' : 'Find address'}
        </Button>
      </div>
      {status ? (
        <p
          className={cn(
            'mt-1 text-xs',
            status.ok ? 'text-emerald-600' : 'text-destructive',
          )}
        >
          {status.text}
        </p>
      ) : null}
    </Field>
  )
}
