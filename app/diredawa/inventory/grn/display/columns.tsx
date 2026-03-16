"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

export type GRNItem = {
  item_name: string
  quantity: number
  unit_measurement?: string
}

export type GRN = {
  grn_no: string | number
  supplier_name: string
  purchase_no: string
  items: GRNItem[]
}

export function getGRNColumns(
  onEdit?: (row: GRN) => void,
  onDelete?: (row: GRN) => void,
  isAdmin?: boolean
): ColumnDef<GRN>[] {
  const cols: ColumnDef<GRN>[] = [
    { accessorKey: "grn_no", header: "GRN No" },
    { accessorKey: "supplier_name", header: "Supplier Name" },
    { accessorKey: "purchase_no", header: "Purchase No" },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.original.items;
        return (
          <ul className="list-disc ml-5">
            {items?.map((item, idx) => (
              <li key={idx}>
                {item.item_name} - {item.quantity} {item.unit_measurement ?? ""}
              </li>
            ))}
          </ul>
        );
      },
    },
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

export const columns: ColumnDef<GRN>[] = [
  { accessorKey: "grn_no", header: "GRN No" },
  { accessorKey: "supplier_name", header: "Supplier Name" },
  { accessorKey: "purchase_no", header: "Purchase No" },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.original.items;
      return (
        <ul className="list-disc ml-5">
          {items?.map((item, idx) => (
            <li key={idx}>
              {item.item_name} - {item.quantity} {item.unit_measurement ?? ""}
            </li>
          ))}
        </ul>
      );
    },
  },
]