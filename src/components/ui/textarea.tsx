import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({
  className,
  rows = 3,
  resizable = false,
  ...props
}: React.ComponentProps<'textarea'> & { resizable?: boolean }) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(
        'flex w-full rounded-xl border-[1.5px] border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50',
        resizable ? 'resize-y' : 'resize-none',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
