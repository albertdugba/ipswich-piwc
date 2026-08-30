import { useState, type ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
} from '@hugeicons/core-free-icons'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import { Input } from './input'
import { Button } from './button'
import { Skeleton } from './skeleton'
import { HugeiconsIcon, SearchIcon, CloseIcon, InboxIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  getRowId?: (row: TData) => string
  isLoading?: boolean
  loadingLabel?: string
  emptyState?: ReactNode
  searchable?: boolean
  searchPlaceholder?: string
  toolbar?: ReactNode
  rowNoun?: [string, string]
  onRowClick?: (row: TData) => void
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  selectionActions?: ReactNode
  pageSize?: number
}

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  isLoading,
  loadingLabel = 'Loading…',
  emptyState,
  searchable,
  searchPlaceholder = 'Search…',
  toolbar,
  rowNoun = ['result', 'results'],
  onRowClick,
  rowSelection,
  onRowSelectionChange,
  selectionActions,
  pageSize,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      ...(rowSelection ? { rowSelection } : {}),
    },
    getRowId,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange,
    enableRowSelection: Boolean(onRowSelectionChange),
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(pageSize
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize } },
        }
      : {}),
  })

  if (!isLoading && data.length === 0 && emptyState) return <>{emptyState}</>

  const rows = table.getRowModel().rows
  const showToolbar = searchable || toolbar
  const total = table.getFilteredRowModel().rows.length
  const pageCount = table.getPageCount()
  const showPager = Boolean(pageSize) && pageCount > 1
  const selectedCount = table.getSelectedRowModel().rows.length

  const { pageIndex, pageSize: ps } = table.getState().pagination
  const start = total === 0 ? 0 : pageIndex * ps + 1
  const end = pageSize ? Math.min((pageIndex + 1) * ps, total) : total
  const countLabel = pageSize
    ? `${start}–${end} of ${total}`
    : `${total} ${total === 1 ? rowNoun[0] : rowNoun[1]}`

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      {showToolbar ? (
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center">
          {selectedCount > 0 ? (
            <div className="flex w-full items-center gap-3">
              <span className="text-sm font-medium text-foreground">
                {selectedCount} selected
              </span>
              <Button variant="ghost" onClick={() => table.resetRowSelection()}>
                Clear
              </Button>
              {selectionActions ? (
                <div className="ml-auto flex items-center gap-2">
                  {selectionActions}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {searchable ? (
                <div className="relative w-full sm:max-w-xs">
                  <HugeiconsIcon
                    icon={SearchIcon}
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    className={cn('pl-9', globalFilter && 'pr-9')}
                  />
                  {globalFilter ? (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setGlobalFilter('')}
                      className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <HugeiconsIcon icon={CloseIcon} className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              ) : null}
              {toolbar ? (
                <div className="flex items-center gap-2 sm:ml-auto">
                  {toolbar}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                return (
                  <TableHead
                    key={header.id}
                    aria-sort={
                      sorted === 'asc'
                        ? 'ascending'
                        : sorted === 'desc'
                          ? 'descending'
                          : undefined
                    }
                    className={cn(
                      meta?.align && alignClass[meta.align],
                      meta?.className,
                    )}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          '-mx-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                          sorted && 'font-semibold text-foreground',
                        )}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <HugeiconsIcon
                          icon={
                            sorted === 'asc'
                              ? ArrowUp01Icon
                              : sorted === 'desc'
                                ? ArrowDown01Icon
                                : ArrowUpDownIcon
                          }
                          className={cn(
                            'size-3.5',
                            sorted
                              ? 'text-brand-600'
                              : 'text-muted-foreground/50',
                          )}
                        />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonRows
              columns={columns.length}
              rows={pageSize ? Math.min(pageSize, 6) : 6}
              label={loadingLabel}
            />
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="px-4 py-14">
                <div className="flex flex-col items-center gap-1 text-center">
                  <HugeiconsIcon
                    icon={InboxIcon}
                    className="size-7 text-muted-foreground/40"
                  />
                  <p className="mt-1 text-sm font-medium text-foreground">
                    No {rowNoun[1]} found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {globalFilter
                      ? `Nothing matches “${globalFilter}”.`
                      : 'Try adjusting your filters.'}
                  </p>
                  {globalFilter ? (
                    <Button
                      variant="outline"
                      className="mt-3"
                      onClick={() => setGlobalFilter('')}
                    >
                      Clear search
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={
                  onRowClick ? () => onRowClick(row.original) : undefined
                }
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        meta?.align && alignClass[meta.align],
                        meta?.nowrap && 'whitespace-nowrap',
                        meta?.className,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!isLoading && rows.length > 0 ? (
        <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/30 px-4 py-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {countLabel}
          </span>
          {showPager ? (
            <div className="flex items-center gap-1">
              <span className="mr-2 hidden text-xs text-muted-foreground tabular-nums sm:inline">
                Page {pageIndex + 1} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function SkeletonRows({
  columns,
  rows,
  label,
}: {
  columns: number
  rows: number
  label: string
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <TableRow key={r} className="hover:bg-transparent">
          {Array.from({ length: columns }, (_, c) => (
            <TableCell key={c}>
              <Skeleton
                className="h-4"
                style={{ width: `${[70, 45, 60, 55, 35, 25][c % 6]}%` }}
              />
              {r === 0 && c === 0 ? (
                <span className="sr-only" role="status">
                  {label}
                </span>
              ) : null}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
