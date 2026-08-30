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
import { membershipStatusLabels } from '@/domain/enums'
import { displayName, initials } from '@/lib/utils'
import type { Person } from '@/domain/person'

export function personHint(p: Person) {
  return p.email || p.phone || membershipStatusLabels[p.membershipStatus]
}

export function matchesPerson(p: Person, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [displayName(p), p.preferredName, p.email, p.phone]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q))
}

export function PersonCombobox({
  id,
  people,
  value,
  onValueChange,
  placeholder = 'Search by name, email or phone',
  disabled,
  invalid,
}: {
  id?: string
  people: Person[]
  value: Person | null
  onValueChange: (person: Person | null) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
}) {
  return (
    <Combobox
      items={people}
      value={value}
      onValueChange={onValueChange}
      itemToStringLabel={displayName}
      isItemEqualToValue={(a, b) => a.id === b.id}
      filter={matchesPerson}
      disabled={disabled}
    >
      <ComboboxInputGroup aria-invalid={invalid}>
        {value ? (
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700"
          >
            {initials(value.firstName, value.lastName)}
          </span>
        ) : (
          <ComboboxSearchIcon />
        )}
        <ComboboxInput id={id} placeholder={placeholder} />
        <ComboboxClear />
        <ComboboxTrigger />
      </ComboboxInputGroup>

      <ComboboxContent>
        <ComboboxEmpty>No one matches that search.</ComboboxEmpty>
        <ComboboxList>
          {(p: Person) => (
            <ComboboxItem key={p.id} value={p}>
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
  )
}
