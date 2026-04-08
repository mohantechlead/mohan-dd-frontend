"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export type GITRow = {
  id: string
  grn_no: string
  purchase_no: string
  item_name: string
  code?: string | null
  purchase_quantity: number
  received_quantity: number
  variance_quantity: number
  variance_type: "increased" | "decreased"
}

export function getGITColumns(
  onWipeOff?: (row: GITRow) => void,
  isAdmin?: boolean
): ColumnDef<GITRow>[] {
  const cols: ColumnDef<GITRow>[] = [
    { accessorKey: "grn_no", header: "GRN No" },
    { accessorKey: "purchase_no", header: "Purchase No" },
    { accessorKey: "item_name", header: "Item Name" },
    { accessorKey: "code", header: "Code" },
    { accessorKey: "purchase_quantity", header: "PO Qty" },
    { accessorKey: "received_quantity", header: "Received Qty" },
    { accessorKey: "variance_quantity", header: "Variance" },
    { accessorKey: "variance_type", header: "Type" },
  ]
  if (isAdmin && onWipeOff) {
    cols.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {onWipeOff && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onWipeOff(row.original)}
              title="Confirm wipe off variance"
              disabled={(row.original.variance_quantity ?? 0) === 0}
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    })
  }
  return cols
}

