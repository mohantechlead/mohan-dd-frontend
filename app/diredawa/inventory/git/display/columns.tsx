"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { GITDisplayRow } from "@/lib/gitMtConversion";

export type { GITRow, GITDisplayRow } from "@/lib/gitMtConversion";

const qtyFmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 6 });

export function getGITColumns(
  onWipeOff?: (row: GITDisplayRow) => void,
  isAdmin?: boolean,
): ColumnDef<GITDisplayRow>[] {
  const cols: ColumnDef<GITDisplayRow>[] = [
    { accessorKey: "grn_no", header: "GRN No" },
    { accessorKey: "purchase_no", header: "Purchase No" },
    { accessorKey: "item_name", header: "Item Name" },
    { accessorKey: "code", header: "Code" },
    {
      accessorKey: "grn_unit_label",
      header: "GRN unit",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.grn_unit_label}</span>
      ),
    },
    {
      id: "po_qty_mt",
      header: "PO Qty (MT)",
      accessorFn: (r) => r.purchase_quantity_mt,
      cell: ({ row }) => <span>{qtyFmt(row.original.purchase_quantity_mt)}</span>,
    },
    {
      id: "received_mt",
      header: "Received (MT)",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{qtyFmt(r.received_quantity_mt)} MT</span>
            {r.grn_kg_converted_to_mt && (
              <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 w-fit">
                ÷ 1000 from {qtyFmt(r.received_quantity)} KG
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "variance_mt",
      header: "Variance (MT)",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <span>{qtyFmt(r.variance_quantity_mt)}</span>
            {r.grn_kg_converted_to_mt && (
              <span className="text-xs text-muted-foreground">vs PO in MT</span>
            )}
          </div>
        );
      },
    },
    {
      id: "variance_type_mt",
      header: "Type",
      accessorFn: (r) => r.variance_type_mt,
      cell: ({ row }) => (
        <span className="capitalize">{row.original.variance_type_mt}</span>
      ),
    },
  ];
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
              disabled={Math.abs(row.original.variance_quantity_mt) < 1e-9}
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    });
  }
  return cols;
}
