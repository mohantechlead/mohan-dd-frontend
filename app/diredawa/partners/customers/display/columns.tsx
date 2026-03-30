"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2 } from "lucide-react"

export type Customer = {
  id?: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  partner_type: string
  tin_number: string | null
  contact_person?: string | null
  comments?: string | null
}

export function getCustomerColumns(
  onEdit?: (row: Customer) => void,
  onDelete?: (row: Customer) => void,
  isAdmin?: boolean,
  onView?: (row: Customer) => void
): ColumnDef<Customer>[] {
  const cols: ColumnDef<Customer>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "contact_person", header: "Contact Person", cell: ({ row }) => row.original.contact_person || "—" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "address", header: "Address" },
    { accessorKey: "partner_type", header: "Partner Type" },
    { accessorKey: "tin_number", header: "Tin Number" },
    {
      accessorKey: "comments",
      header: "Comments",
      cell: ({ row }) => {
        const c = row.original.comments?.trim();
        if (!c) return "—";
        return (
          <span className="line-clamp-2 max-w-[200px] text-left" title={c}>
            {c}
          </span>
        );
      },
    },
  ]
  if (onView || (isAdmin && (onEdit || onDelete))) {
    cols.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {onView && row.original.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(row.original)}
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          {isAdmin && onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {isAdmin && onDelete && (
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
  { accessorKey: "contact_person", header: "Contact Person" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "phone", header: "Phone" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "partner_type", header: "Partner Type" },
  { accessorKey: "tin_number", header: "Tin Number" },
  { accessorKey: "comments", header: "Comments" },
]