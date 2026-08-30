import { useEffect, useMemo, useState } from 'react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxSearchIcon,
  ComboboxTrigger,
} from '@/components/ui/combobox'
import { usePeople } from '@/features/people/queries'
import { useSetDepartmentMember } from './queries'
import {
  departmentRoleLabels,
  departmentRoleValues,
  membershipStatusLabels,
  type DepartmentRole,
} from '@/domain/enums'
import { AlertIcon, HugeiconsIcon, SpinnerIcon } from '@/lib/icons'
import { displayName, initials } from '@/lib/utils'
import type { Person } from '@/domain/person'

const roleHints: Record<DepartmentRole, string> = {
  LEADER: 'Oversees the ministry and its members.',
  ASSISTANT_LEADER: 'Supports the leader and can stand in.',
  MEMBER: 'Serves in the ministry.',
}

function personHint(p: Person) {
  return p.email || p.phone || membershipStatusLabels[p.membershipStatus]
}

function matchesPerson(p: Person, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [displayName(p), p.preferredName, p.email, p.phone]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q))
}

export function AddMemberDialog({
  open,
  onOpenChange,
  departmentId,
  existingPersonIds,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  departmentId: string
  existingPersonIds: Set<string>
}) {
  const peopleQuery = usePeople()
  const setMember = useSetDepartmentMember()
  const [person, setPerson] = useState<Person | null>(null)
  const [role, setRole] = useState<DepartmentRole>('MEMBER')
  const [error, setError] = useState<string | null>(null)

  const available = useMemo(
    () => (peopleQuery.data ?? []).filter((p) => !existingPersonIds.has(p.id)),
    [peopleQuery.data, existingPersonIds],
  )

  useEffect(() => {
    if (!open) return
    setPerson(null)
    setRole('MEMBER')
    setError(null)
  }, [open])

  const noneAvailable = !peopleQuery.isLoading && available.length === 0

  function submit() {
    if (!person) {
      setError('Select a person to add.')
      return
    }
    setError(null)
    setMember.mutate(
      { departmentId, personId: person.id, role },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e) =>
          setError(e instanceof Error ? e.message : 'Could not add member.'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
          <DialogDescription>
            Search for someone already in the directory and give them a role.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="add-member-person"
              className="text-xs font-medium text-muted-foreground"
            >
              Person
            </Label>

            <Combobox
              items={available}
              value={person}
              onValueChange={(next) => {
                setPerson(next)
                if (next) setError(null)
              }}
              itemToStringLabel={displayName}
              isItemEqualToValue={(a, b) => a.id === b.id}
              filter={matchesPerson}
              disabled={noneAvailable}
            >
              <ComboboxInputGroup>
                {person ? (
                  <span
                    aria-hidden
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700"
                  >
                    {initials(person.firstName, person.lastName)}
                  </span>
                ) : (
                  <ComboboxSearchIcon />
                )}
                <ComboboxInput
                  id="add-member-person"
                  placeholder={
                    peopleQuery.isLoading
                      ? 'Loading people…'
                      : 'Search by name, email or phone'
                  }
                />
                <ComboboxClear />
                <ComboboxTrigger />
              </ComboboxInputGroup>

              <ComboboxContent>
                <ComboboxEmpty>No one matches that search.</ComboboxEmpty>
                <ComboboxList>
                  {(p: Person) => (
                    <ComboboxItem key={p.id} value={p} className="py-2">
                      <span
                        aria-hidden
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground"
                      >
                        {initials(p.firstName, p.lastName)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">
                          {displayName(p)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {personHint(p)}
                        </span>
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>

            {peopleQuery.isLoading ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <HugeiconsIcon
                  icon={SpinnerIcon}
                  className="size-3.5 animate-spin"
                />
                Loading people…
              </p>
            ) : noneAvailable ? (
              <p className="text-xs text-muted-foreground">
                Everyone in the directory is already in this ministry.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Role
            </Label>
            <Select
              value={role}
              onValueChange={(v) => setRole((v as DepartmentRole) ?? 'MEMBER')}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string | null) =>
                    v
                      ? departmentRoleLabels[v as DepartmentRole]
                      : 'Select a role'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {departmentRoleValues.map((r) => (
                  <SelectItem key={r} value={r} className="py-2">
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">
                        {departmentRoleLabels[r]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {roleHints[r]}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <HugeiconsIcon
                icon={AlertIcon}
                className="mt-0.5 size-4 shrink-0"
              />
              {error}
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
          <Button
            type="button"
            onClick={submit}
            disabled={setMember.isPending || !person}
          >
            {setMember.isPending ? 'Adding…' : 'Add to ministry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
