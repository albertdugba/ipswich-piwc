import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PersonForm } from './PersonForm'
import { useCreatePerson, useUpdatePerson } from './queries'
import { displayName } from '@/lib/utils'
import type { Person, PersonFormValues } from '@/domain/person'

export function PersonFormDialog({
  open,
  onOpenChange,
  person,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  person?: Person
  onCreated?: (id: string) => void
}) {
  const isEdit = Boolean(person)
  const createPerson = useCreatePerson()
  const updatePerson = useUpdatePerson()
  const [error, setError] = useState<string | null>(null)

  const submitting = createPerson.isPending || updatePerson.isPending

  function handleSubmit(values: PersonFormValues) {
    setError(null)
    if (person) {
      updatePerson.mutate(
        { id: person.id, values },
        {
          onSuccess: () => onOpenChange(false),
          onError: (e) => setError(errorMessage(e)),
        },
      )
    } else {
      createPerson.mutate(values, {
        onSuccess: (id) => {
          onOpenChange(false)
          onCreated?.(id)
        },
        onError: (e) => setError(errorMessage(e)),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${displayName(person!)}` : 'Add member'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this person’s details.'
              : 'Add a new person to the church record. Only name is required.'}
          </DialogDescription>
        </DialogHeader>
        <PersonForm
          key={person?.id ?? 'new'}
          person={person}
          submitting={submitting}
          submitLabel={isEdit ? 'Save changes' : 'Add member'}
          error={error}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong. Please retry.'
}
