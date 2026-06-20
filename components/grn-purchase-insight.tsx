"use client";

import Link from "next/link";
import { formatQuantityDisplay } from "@/lib/inventoryQuantity";

export interface GrnRelatedItem {
  item_name: string;
  quantity: number;
  unit_measurement?: string | null;
  code?: string | null;
}

export interface GrnRelated {
  grn_no: string;
  date?: string | null;
  is_last?: boolean;
  is_current?: boolean;
  items: GrnRelatedItem[];
}

export interface GrnPerGrnReceipt {
  grn_no: string;
  quantity: number;
  unit_measurement?: string | null;
  is_current?: boolean;
}

export interface GrnReceiptComparisonRow {
  item_name: string;
  ordered_quantity: number;
  ordered_unit?: string | null;
  received_total: number;
  this_grn_quantity: number;
  this_grn_unit?: string | null;
  comparison_unit?: string | null;
  variance: number;
  per_grn_receipts?: GrnPerGrnReceipt[];
}

export interface GrnPurchaseInsightSource {
  grn_no: string;
  purchase_no?: string | null;
  related_grns?: GrnRelated[];
  receipt_comparison?: GrnReceiptComparisonRow[];
}

const qtyLabel = (unit?: string | null) =>
  unit?.trim() ? ` (${unit.trim()})` : "";

const formatQtyUnit = (qty: number, unit?: string | null) =>
  `${formatQuantityDisplay(qty)}${unit?.trim() ? ` ${unit.trim()}` : ""}`;

const formatOrdered = (qty: number, unit?: string | null) =>
  formatQtyUnit(qty, unit);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function grnColumnOrder(
  related: GrnRelated[],
  comparison: GrnReceiptComparisonRow[],
): string[] {
  if (related.length > 0) {
    return related.map((r) => r.grn_no);
  }
  const fromRow = comparison[0]?.per_grn_receipts?.map((p) => p.grn_no) ?? [];
  return fromRow;
}

export function GrnPurchaseInsightPanel({
  grn,
}: {
  grn: GrnPurchaseInsightSource;
}) {
  const purchaseNo = grn.purchase_no?.trim();
  const related = grn.related_grns ?? [];
  const comparison = grn.receipt_comparison ?? [];
  const grnColumns = grnColumnOrder(related, comparison);
  const relatedByGrn = Object.fromEntries(related.map((r) => [r.grn_no, r]));

  if (!purchaseNo) {
    return (
      <p className="text-sm text-muted-foreground">
        No purchase linked — related GRN comparison is not available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Purchase{" "}
        <span className="font-medium text-foreground">{purchaseNo}</span>
        {" · "}
        {grnColumns.length} GRN{grnColumns.length === 1 ? "" : "s"}
      </p>

      {comparison.length > 0 ? (
        <div className="border rounded-md overflow-hidden bg-white">
          <h3 className="px-4 py-2 text-sm font-semibold bg-muted/60 border-b">
            Purchase Order vs Received by GRN
          </h3>
          <p className="px-4 py-2 text-xs text-muted-foreground border-b">
            Each GRN column shows quantity and unit as entered. Total and
            variance use MT comparison (KG ÷ 1000 when purchase is MT).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left align-bottom">Item</th>
                  <th className="px-3 py-2 text-right align-bottom">Ordered</th>
                  {grnColumns.map((grnNo) => {
                    const meta = relatedByGrn[grnNo];
                    const isCurrent =
                      meta?.is_current ||
                      comparison[0]?.per_grn_receipts?.find(
                        (p) => p.grn_no === grnNo,
                      )?.is_current;
                    return (
                      <th
                        key={grnNo}
                        className={`px-3 py-2 text-right align-bottom min-w-[100px] ${
                          isCurrent ? "bg-blue-50/80" : ""
                        }`}
                      >
                        <div className="font-semibold">
                          {isCurrent ? (
                            <span>{grnNo} (this)</span>
                          ) : (
                            <Link
                              href={`/diredawa/inventory/grn/${encodeURIComponent(grnNo)}`}
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {grnNo}
                            </Link>
                          )}
                        </div>
                        {meta ? (
                          <div className="text-xs font-normal text-muted-foreground mt-1">
                            {formatDate(meta.date)}
                            {meta.is_last ? " · Last" : ""}
                          </div>
                        ) : null}
                      </th>
                    );
                  })}
                  <th className="px-3 py-2 text-right align-bottom">
                    Total Received
                    {qtyLabel(comparison[0]?.comparison_unit)}
                  </th>
                  <th className="px-3 py-2 text-right align-bottom">
                    Variance
                    {qtyLabel(comparison[0]?.comparison_unit)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, idx) => {
                  const variance = row.variance;
                  const varianceClass =
                    variance > 0
                      ? "text-amber-600"
                      : variance < 0
                        ? "text-red-600"
                        : "text-muted-foreground";
                  const perGrnMap = Object.fromEntries(
                    (row.per_grn_receipts ?? []).map((p) => [p.grn_no, p]),
                  );

                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{row.item_name}</td>
                      <td className="px-3 py-2 text-right">
                        {formatOrdered(
                          row.ordered_quantity,
                          row.ordered_unit,
                        )}
                      </td>
                      {grnColumns.map((grnNo) => {
                        const cell = perGrnMap[grnNo];
                        const isCurrent = cell?.is_current;
                        return (
                          <td
                            key={`${idx}-${grnNo}`}
                            className={`px-3 py-2 text-right ${
                              isCurrent ? "bg-blue-50/50 font-medium" : ""
                            }`}
                          >
                            {cell && cell.quantity > 0
                              ? formatQtyUnit(
                                  cell.quantity,
                                  cell.unit_measurement,
                                )
                              : "—"}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right font-medium">
                        {formatQuantityDisplay(row.received_total)}
                        {row.comparison_unit ? ` ${row.comparison_unit}` : ""}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold ${varianceClass}`}
                      >
                        {variance > 0
                          ? `+${formatQuantityDisplay(variance)}`
                          : variance < 0
                            ? `−${formatQuantityDisplay(Math.abs(variance))}`
                            : formatQuantityDisplay(0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No purchase line items to compare.
        </p>
      )}
    </div>
  );
}
