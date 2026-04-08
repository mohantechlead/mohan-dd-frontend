"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2 } from "lucide-react"

export type DNItem = {
  code?: string
  item_name: string
  quantity: number
  unit_measurement?: string
  internal_code?: string
}

export type DN = {
  dn_no: string
  customer_name: string
  sales_no: string
  items: DNItem[]
}

export function getDNColumns(
  onEdit?: (row: DN) => void,
  onDelete?: (row: DN) => void,
  isAdmin?: boolean,
  onView?: (row: DN) => void
): ColumnDef<DN>[] {
  const cols: ColumnDef<DN>[] = [
    {
      accessorKey: "dn_no",
      header: "Delivery Number",
      cell: ({ row }) => {
        const dnNo = row.original.dn_no;
        if (onView) {
          return (
            <button
              type="button"
              className="text-primary hover:underline font-medium text-left"
              onClick={() => onView(row.original)}
            >
              {dnNo}
            </button>
          );
        }
        return <span>{dnNo}</span>;
      },
    },
    { accessorKey: "customer_name", header: "Customer Name" },
    { accessorKey: "sales_no", header: "Sales No" },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.original.items;
        return (
          <ul className="list-disc ml-5">
            {items?.map((item, idx) => (
              <li key={idx}>
                {item.item_name} - Code: {item.code || item.internal_code || "-"} - {item.quantity} {item.unit_measurement ?? ""}
              </li>
            ))}
          </ul>
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
          {onView && (
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

export const columns: ColumnDef<DN>[] = [
  { accessorKey: "dn_no", header: "Delivery Number" },
  { accessorKey: "customer_name", header: "Customer Name" },
  { accessorKey: "sales_no", header: "Sales No" },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.original.items;
      return (
        <ul className="list-disc ml-5">
          {items?.map((item, idx) => (
            <li key={idx}>
              {item.item_name} - Code: {item.code || item.internal_code || "-"} - {item.quantity} {item.unit_measurement ?? ""}
            </li>
          ))}
        </ul>
      );
    },
  },
]
