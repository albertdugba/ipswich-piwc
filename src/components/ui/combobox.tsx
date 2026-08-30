'use client'

import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox'

import { cn } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  Cancel01Icon,
  Search01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'

/*
 * Autocomplete / combobox built on Base UI, styled to match the Select and
 * Input primitives. Use this instead of <Select> whenever the option list is
 * long enough that a user would rather type than scroll (people, ministries…).
 *
 * Typical shape:
 *   <Combobox items={people} itemToStringLabel={displayName} value={p} onValueChange={setP}>
 *     <ComboboxInputGroup>
 *       <ComboboxInput placeholder="Search people…" />
 *       <ComboboxClear />
 *       <ComboboxTrigger />
 *     </ComboboxInputGroup>
 *     <ComboboxContent>
 *       <ComboboxEmpty>No matches.</ComboboxEmpty>
 *       <ComboboxList>{(p) => <ComboboxItem key={p.id} value={p}>…</ComboboxItem>}</ComboboxList>
 *     </ComboboxContent>
 *   </Combobox>
 */

const Combobox = ComboboxPrimitive.Root
const ComboboxValue = ComboboxPrimitive.Value
const ComboboxCollection = ComboboxPrimitive.Collection
const ComboboxRow = ComboboxPrimitive.Row

/** The bordered field shell. Owns the focus ring so the inner input can be bare. */
function ComboboxInputGroup({
  className,
  ...props
}: ComboboxPrimitive.InputGroup.Props) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-input-group"
      className={cn(
        'flex h-10 w-full items-center gap-2 rounded-xl border-[1.5px] border-input bg-transparent pr-1.5 pl-3 text-sm transition-colors outline-none has-[input:focus-visible]:border-ring has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50 data-open:border-ring aria-invalid:border-destructive dark:bg-input/30',
        className,
      )}
      {...props}
    />
  )
}

/** Optional leading magnifier. Purely decorative — clicks pass through to the input. */
function ComboboxSearchIcon({ className }: { className?: string }) {
  return (
    <HugeiconsIcon
      icon={Search01Icon}
      aria-hidden
      className={cn(
        'pointer-events-none size-4 shrink-0 text-muted-foreground',
        className,
      )}
    />
  )
}

function ComboboxInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      className={cn(
        'h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  )
}

/** Chevron button that toggles the popup. */
function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn(
        'group flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none',
        className,
      )}
      {...props}
    >
      {children ?? (
        <ComboboxPrimitive.Icon
          render={
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              className="size-4 transition-transform duration-150 group-data-open:rotate-180"
            />
          }
        />
      )}
    </ComboboxPrimitive.Trigger>
  )
}

/** Clears the selection. Base UI only shows it when there is a value. */
function ComboboxClear({
  className,
  children,
  ...props
}: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      aria-label="Clear selection"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none',
        className,
      )}
      {...props}
    >
      {children ?? <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />}
    </ComboboxPrimitive.Clear>
  )
}

function ComboboxContent({
  className,
  children,
  side = 'bottom',
  sideOffset = 6,
  align = 'start',
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset'
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        className="isolate z-50 outline-none"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            'max-h-[min(18rem,var(--available-height))] w-(--anchor-width) origin-(--transform-origin) overflow-y-auto overscroll-contain rounded-2xl bg-popover p-1.5 text-popover-foreground shadow-xl shadow-black/5 ring-1 ring-foreground/5 duration-100 outline-none data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            className,
          )}
          {...props}
        >
          {children}
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn('flex flex-col', className)}
      {...props}
    />
  )
}

/*
 * Base UI keeps Empty mounted so screen readers hear the change, so this always
 * renders an element — it just collapses to nothing when the list has items.
 */
function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        'px-3 py-6 text-center text-sm text-muted-foreground empty:m-0 empty:p-0',
        className,
      )}
      {...props}
    />
  )
}

function ComboboxItem({
  className,
  children,
  showIndicator = true,
  ...props
}: ComboboxPrimitive.Item.Props & { showIndicator?: boolean }) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex cursor-default items-center gap-2.5 rounded-xl py-2 pr-9 pl-3 text-sm outline-none select-none data-highlighted:bg-muted data-highlighted:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      {showIndicator ? (
        <ComboboxPrimitive.ItemIndicator
          render={
            <span className="pointer-events-none absolute right-3 flex size-4 items-center justify-center text-brand-600" />
          }
        >
          <HugeiconsIcon icon={Tick02Icon} className="size-4" />
        </ComboboxPrimitive.ItemIndicator>
      ) : null}
    </ComboboxPrimitive.Item>
  )
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn('scroll-my-1', className)}
      {...props}
    />
  )
}

function ComboboxGroupLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-group-label"
      className={cn(
        'px-3 py-1.5 text-xs font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn('-mx-1.5 my-1.5 h-px bg-border', className)}
      {...props}
    />
  )
}

export {
  Combobox,
  ComboboxClear,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxRow,
  ComboboxSearchIcon,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
}
