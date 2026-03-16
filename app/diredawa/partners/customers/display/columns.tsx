"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

export type Customer = {
  id?: string
  name: string
  email: string
  phone: string
  address: string
  partner_type: string
  tin_number: string
}

export function getCustomerColumns(
  onEdit?: (row: Customer) => void,
  onDelete?: (row: Customer) => void,
  isAdmin?: boolean
): ColumnDef<Customer>[] {
  const cols: ColumnDef<Customer>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "address", header: "Address" },
    { accessorKey: "partner_type", header: "Partner Type" },
    { accessorKey: "tin_number", header: "Tin Number" },
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

export const columns: ColumnDef<Customer>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "phone", header: "Phone" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "partner_type", header: "Partner Type" },
  { accessorKey: "tin_number", header: "Tin Number" },
]