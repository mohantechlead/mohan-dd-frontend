"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

export type Items = {
  item_id?: string
  item_name: string
  hscode: string
  internal_code: string
}

export function getItemsColumns(
  onEdit?: (row: Items) => void,
  onDelete?: (row: Items) => void,
  isAdmin?: boolean
): ColumnDef<Items>[] {
  const cols: ColumnDef<Items>[] = [
    { accessorKey: "item_name", header: "Item Name" },
    { accessorKey: "hscode", header: "HS Code" },
    { accessorKey: "internal_code", header: "Internal Code" },
  ]
  if (isAdmin && (onEdit || onDelete)) {
    cols.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(row.original)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    })
  }
  return cols
}

export const columns: ColumnDef<Items>[] = [
  { accessorKey: "item_name", header: "Item Name" },
  { accessorKey: "hscode", header: "HS Code" },
  { accessorKey: "internal_code", header: "Internal Code" },
]