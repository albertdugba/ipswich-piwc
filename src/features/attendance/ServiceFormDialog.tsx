import { useForm } from 'react-hook-form'
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
import { useCreateService, useUpdateService } from './queries'
import {
  serviceFormSchema,
  todayIso,
  type Service,
  type ServiceFormInput,
  type ServiceFormValues,
} from '@/domain/service'

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service
  onCreated?: (id: string) => void
}) {
  const editing = Boolean(service)
  const create = useCreateService()
  const update = useUpdateService()
  const submitting = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit service' : 'Add service'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update this service’s details.'
              : 'Create a service, then record who attended.'}
          </DialogDescription>
        </DialogHeader>
        <ServiceForm
          key={service?.id ?? 'new'}
          service={service}
          editing={editing}
          submitting={submitting}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => {
            if (service) {
              update.mutate(
                { id: service.id, values },
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

function ServiceForm({
  service,
  editing,
  submitting,
  onSubmit,
  onCancel,
}: {
  service?: Service
  editing: boolean
  submitting: boolean
  onSubmit: (values: ServiceFormValues) => void
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormInput, unknown, ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: service?.name ?? 'Sunday Worship',
      serviceDate: service?.serviceDate ?? todayIso(),
      notes: service?.notes ?? '',
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Name<span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              {...register('name')}
              placeholder="e.g. Sunday Worship"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Date<span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              type="date"
              {...register('serviceDate')}
              aria-invalid={Boolean(errors.serviceDate)}
            />
            {errors.serviceDate ? (
              <p className="text-xs text-destructive">
                {errors.serviceDate.message}
              </p>
            ) : null}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Notes
          </Label>
          <Textarea {...register('notes')} rows={2} />
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add service'}
        </Button>
      </DialogFooter>
    </form>
  )
}
