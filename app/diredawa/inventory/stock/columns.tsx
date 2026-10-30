"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye, PackageMinus } from "lucide-react";
import { formatQuantityDisplay } from "@/lib/inventoryQuantity";

export type Items = {
  item_name: string;
  code?: string;
  quantity: string;
  package: string;
  grn_nos?: string[];
  dn_nos?: string[];
};

export function getStockColumns(
  onView?: (row: Items) => void,
  onAdjust?: (row: Items) => void,
): ColumnDef<Items>[] {
  const cols: ColumnDef<Items>[] = [
    {
      accessorKey: "item_name",
      header: "Item Name",
    },
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "quantity",
      header: "Stock Quantity",
      cell: ({ row }) => formatQuantityDisplay(row.original.quantity),
    },
    {
      accessorKey: "package",
      header: "Stock Bags",
      cell: ({ row }) => formatQuantityDisplay(row.original.package),
    },
    {
      accessorKey: "grn_nos",
      header: "GRN Nos",
      cell: ({ row }) =>
        row.original.grn_nos?.length ? row.original.grn_nos.join(", ") : "-",
    },
    {
      accessorKey: "dn_nos",
      header: "DN Nos",
      cell: ({ row }) =>
        row.original.dn_nos?.length ? row.original.dn_nos.join(", ") : "-",
    },
  ];

  if (onView || onAdjust) {
    cols.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(row.original)}
              title="View stock transactions"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onAdjust && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAdjust(row.original)}
              title="Adjust stock (lost / contaminated)"
            >
              <PackageMinus className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    });
  }

  return cols;
}

export const columns: ColumnDef<Items>[] = getStockColumns();
