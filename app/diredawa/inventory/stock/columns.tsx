"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
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

  if (onView) {
    cols.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(row.original)}
          title="View stock transactions"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    });
  }

  return cols;
}

export const columns: ColumnDef<Items>[] = getStockColumns();
