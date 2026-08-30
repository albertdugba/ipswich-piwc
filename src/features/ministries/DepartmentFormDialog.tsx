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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateDepartment, useUpdateDepartment } from './queries'
import {
  departmentFormSchema,
  type Department,
  type DepartmentFormInput,
  type DepartmentFormValues,
} from '@/domain/department'

/*
 * Create / edit a ministry. Validated with Zod at submit (Rule 8) and owns the
 * Firestore mutation; parent controls `open`.
 */
export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  department?: Department
  onCreated?: (id: string) => void
}) {
  const isEdit = Boolean(department)
  const create = useCreateDepartment()
  const update = useUpdateDepartment()
  const submitting = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit ministry' : 'Add ministry'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this ministry’s details.'
              : 'Create a new ministry or department.'}
          </DialogDescription>
        </DialogHeader>
        <DepartmentForm
          key={department?.id ?? 'new'}
          department={department}
          submitting={submitting}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => {
            if (department) {
              update.mutate(
                { id: department.id, values },
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
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function DepartmentForm({
  department,
  submitting,
  onSubmit,
  onCancel,
}: {
  department?: Department
  submitting: boolean
  onSubmit: (values: DepartmentFormValues) => void
  onCancel: () => void
}) {
  const editing = Boolean(department)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFormInput, unknown, DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: department?.name ?? '',
      description: department?.description ?? '',
      isActive: department?.isActive ?? true,
    },
    mode: 'onTouched',
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <DialogBody className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Name<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            {...register('name')}
            autoFocus
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name ? (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Description
          </Label>
          <Textarea
            {...register('description')}
            rows={3}
            placeholder="What this ministry does"
          />
        </div>
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
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add ministry'}
        </Button>
      </DialogFooter>
    </form>
  )
}
