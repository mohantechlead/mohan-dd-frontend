"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { formatQuantityDisplay } from "@/lib/inventoryQuantity"

export type GRNItem = {
  code?: string
  item_name: string
  quantity: number
  unit_measurement?: string
  internal_code?: string
}

export type GRN = {
  grn_no: string | number
  supplier_name: string
  purchase_no: string
  purchase_id?: string

  received_from?: string | null
  truck_no?: string | null
  total_quantity?: number | null
  store_name?: string | null
  store_keeper?: string | null
  remark?: string | null
  items: GRNItem[]
}

export function getGRNColumns(
  onEdit?: (row: GRN) => void,
  onDelete?: (row: GRN) => void,
  isAdmin?: boolean,
  onView?: (row: GRN) => void
): ColumnDef<GRN>[] {
  const cols: ColumnDef<GRN>[] = [
    {
      accessorKey: "grn_no",
      header: "GRN No",
      cell: ({ row }) => {
        const grnNo = String(row.original.grn_no);
        if (onView) {
          return (
            <button
              type="button"
              className="text-primary hover:underline font-medium text-left"
              onClick={() => onView(row.original)}
            >
              {grnNo}
            </button>
          );
        }
        return <span>{grnNo}</span>;
      },
    },
    { accessorKey: "supplier_name", header: "Supplier Name" },
    { accessorKey: "received_from", header: "Received From" },
    { accessorKey: "truck_no", header: "Truck No" },
    { accessorKey: "purchase_no", header: "Purchase No" },
    { accessorKey: "store_name", header: "Store Name" },
    { accessorKey: "store_keeper", header: "Store Keeper" },
    {
      accessorKey: "total_quantity",
      header: "Total Quantity",
      cell: ({ row }) => formatQuantityDisplay(row.original.total_quantity ?? null),
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.original.items;
        return (
          <ul className="list-disc ml-5">
            {items?.map((item, idx) => (
              <li key={idx}>
                {item.item_name} - Code: {item.code || item.internal_code || "-"} -{" "}
                {formatQuantityDisplay(item.quantity)} {item.unit_measurement ?? ""}
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

export const columns: ColumnDef<GRN>[] = [
  { accessorKey: "grn_no", header: "GRN No" },
  { accessorKey: "supplier_name", header: "Supplier Name" },
  { accessorKey: "received_from", header: "Received From" },
  { accessorKey: "truck_no", header: "Truck No" },
  { accessorKey: "purchase_no", header: "Purchase No" },
  { accessorKey: "store_name", header: "Store Name" },
  { accessorKey: "store_keeper", header: "Store Keeper" },
  {
    accessorKey: "total_quantity",
    header: "Total Quantity",
    cell: ({ row }) => formatQuantityDisplay(row.original.total_quantity ?? null),
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.original.items;
      return (
        <ul className="list-disc ml-5">
          {items?.map((item, idx) => (
            <li key={idx}>
              {item.item_name} - Code: {item.code || item.internal_code || "-"} -{" "}
              {formatQuantityDisplay(item.quantity)} {item.unit_measurement ?? ""}
            </li>
          ))}
        </ul>
      );
    },
  },
]