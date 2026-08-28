"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, ArrowUpCircle } from "lucide-react";
import {
  type WarehouseStorageNote,
  periodLabel,
  money,
  formatDate,
} from "@/lib/warehouse";

function StatusBadge({ status }: { status: string }) {
  const s = String(status ?? "").toLowerCase();
  if (s === "expired") {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
        Expired
      </span>
    );
  }
  if (s === "released") {
    return (
      <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
        Released
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
      Active
    </span>
  );
}

export function ExpiryBanner({ note }: { note: WarehouseStorageNote }) {
  if (!note.expired && !note.periods_expired) {
    if (note.current_expiry_date) {
      return (
        <p className="text-xs text-muted-foreground mt-1">
          Expires{" "}
          <span className="font-medium">{formatDate(note.current_expiry_date)}</span>
        </p>
      );
    }
    return null;
  }
  return (
    <div className="mt-1 rounded-md bg-red-50 border border-red-200 px-2 py-1 text-xs text-red-800">
      <strong>Expired</strong> —{" "}
      {note.periods_expired > 0
        ? `${note.periods_expired} period${note.periods_expired > 1 ? "s" : ""} past expiry.`
        : "Past expiry."}{" "}
      {note.current_expiration_fee != null && (
        <span>
          Current fee: <span className="font-semibold">{money(note.current_expiration_fee)}</span>
        </span>
      )}
    </div>
  );
}

export function getStorageNoteColumns(
  onEdit?: (row: WarehouseStorageNote) => void,
  onDelete?: (row: WarehouseStorageNote) => void,
  onTopUp?: (row: WarehouseStorageNote) => void,
  isAdmin?: boolean,
  onView?: (row: WarehouseStorageNote) => void,
): ColumnDef<WarehouseStorageNote>[] {
  const cols: ColumnDef<WarehouseStorageNote>[] = [
    {
      accessorKey: "wsn_no",
      header: "WSN #",
      cell: ({ row }) => {
        const wsn = String(row.original.wsn_no);
        if (onView) {
          return (
            <button
              type="button"
              className="text-primary hover:underline font-medium text-left"
              onClick={() => onView(row.original)}
            >
              {wsn}
            </button>
          );
        }
        return <span>{wsn}</span>;
      },
    },
    { accessorKey: "customer_name", header: "Customer" },
    {
      accessorKey: "date",
      header: "Storage Start",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "storage_period_value",
      header: "Storage Period",
      cell: ({ row }) =>
        periodLabel(row.original.storage_period_value, row.original.storage_period_unit),
    },
    {
      accessorKey: "current_expiry_date",
      header: "Expiry Date",
      cell: ({ row }) => formatDate(row.original.current_expiry_date),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "current_expiration_fee",
      header: "Current Fee",
      cell: ({ row }) => (
        <div>
          {money(row.original.current_expiration_fee)}
          <ExpiryBanner note={row.original} />
        </div>
      ),
    },
  ];

  if (onView || isAdmin || onTopUp) {
    cols.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
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
          {onTopUp && String(row.original.status).toLowerCase() !== "expired" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTopUp(row.original)}
              title="Top up / extend period"
            >
              <ArrowUpCircle className="w-4 h-4" />
            </Button>
          )}
          {isAdmin && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row.original)}
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {isAdmin && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(row.original)}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    });
  }

  return cols;
}
