"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination, clamp, getPageCount } from "@/components/table-pagination"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowClick?: (row: TData) => void
  getRowId?: (row: TData) => string
  selectedRowId?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  getRowId,
  selectedRowId,
}: DataTableProps<TData, TValue>) {
  const totalItems = data.length
  const pageSizeOptions = useMemo(() => [10, 20, 50, 100], [])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  useEffect(() => {
    const pageCount = getPageCount(totalItems, pagination.pageSize)
    const nextIndex = clamp(pagination.pageIndex, 0, pageCount - 1)
    if (nextIndex !== pagination.pageIndex) {
      setPagination((p) => ({ ...p, pageIndex: nextIndex }))
    }
  }, [pagination.pageIndex, pagination.pageSize, totalItems])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { pagination },
  })

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getPaginationRowModel().rows?.length ? (
            table.getPaginationRowModel().rows.map((row) => {
              const rowId = getRowId?.(row.original)
              const isSelected = rowId != null && rowId === selectedRowId
              return (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={
                  onRowClick
                    ? `cursor-pointer hover:bg-muted/50 ${isSelected ? "bg-muted/70" : ""}`
                    : undefined
                }
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        pageIndex={table.getState().pagination.pageIndex}
        pageSize={table.getState().pagination.pageSize}
        totalItems={totalItems}
        pageSizeOptions={pageSizeOptions}
        onPageIndexChange={(next) => table.setPageIndex(next)}
        onPageSizeChange={(next) => table.setPageSize(next)}
      />
    </div>
  )
}