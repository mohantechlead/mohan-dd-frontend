"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { formatQuantityDisplay } from "@/lib/inventoryQuantity";
import { type WarehouseReleaseNote, formatDate } from "@/lib/warehouse";

export function getReleaseNoteColumns(
  onView?: (row: WarehouseReleaseNote) => void,
): ColumnDef<WarehouseReleaseNote>[] {
  const cols: ColumnDef<WarehouseReleaseNote>[] = [
    {
      accessorKey: "wrn_no",
      header: "Release Note No",
      cell: ({ row }) => {
        const wrn = String(row.original.wrn_no);
        if (onView) {
          return (
            <button
              type="button"
              className="text-primary hover:underline font-medium text-left"
              onClick={() => onView(row.original)}
            >
              {wrn}
            </button>
          );
        }
        return <span>{wrn}</span>;
      },
    },
    {
      accessorKey: "wsn_no",
      header: "Source Storage Note",
      cell: ({ row }) => row.original.wsn_no || row.original.storage_note_id || "—",
    },
    { accessorKey: "customer_name", header: "Customer" },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "items",
      header: "Released Items",
      cell: ({ row }) => {
        const items = row.original.items;
        return (
          <ul className="list-disc ml-5">
            {(items ?? []).map((item, idx) => (
              <li key={idx}>
                {item.item_name} -{" "}
                {formatQuantityDisplay(item.quantity)}{" "}
                {item.unit_measurement ?? ""}
              </li>
            ))}
            {(items ?? []).length === 0 && <li>—</li>}
          </ul>
        );
      },
    },
  ];
  if (onView) {
    cols.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(row.original)}
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    });
  }
  return cols;
}
