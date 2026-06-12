"use client";

import Link from "next/link";
import { formatQuantityDisplay } from "@/lib/inventoryQuantity";

export interface DnRelatedItem {
  item_name: string;
  quantity: number;
  unit_measurement?: string | null;
  code?: string | null;
}

export interface DnRelated {
  dn_no: string;
  date?: string | null;
  is_last?: boolean;
  is_current?: boolean;
  items: DnRelatedItem[];
}

export interface DnPerDnDelivery {
  dn_no: string;
  quantity: number;
  unit_measurement?: string | null;
  is_current?: boolean;
}

export interface DnDeliveryComparisonRow {
  item_name: string;
  invoiced_quantity: number;
  invoiced_unit?: string | null;
  delivered_total: number;
  this_dn_quantity: number;
  this_dn_unit?: string | null;
  comparison_unit?: string | null;
  variance: number;
  per_dn_deliveries?: DnPerDnDelivery[];
}

export interface DnInvoiceInsightSource {
  dn_no: string;
  invoice_no?: string | null;
  sales_no?: string;
  related_dns?: DnRelated[];
  delivery_comparison?: DnDeliveryComparisonRow[];
}

const qtyLabel = (unit?: string | null) =>
  unit?.trim() ? ` (${unit.trim()})` : "";

const formatQtyUnit = (qty: number, unit?: string | null) =>
  `${formatQuantityDisplay(qty)}${unit?.trim() ? ` ${unit.trim()}` : ""}`;

const formatInvoiced = (qty: number, unit?: string | null) =>
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

function dnColumnOrder(
  related: DnRelated[],
  comparison: DnDeliveryComparisonRow[],
): string[] {
  if (related.length > 0) {
    return related.map((r) => r.dn_no);
  }
  const fromRow = comparison[0]?.per_dn_deliveries?.map((p) => p.dn_no) ?? [];
  return fromRow;
}

export function DnInvoiceInsightPanel({ dn }: { dn: DnInvoiceInsightSource }) {
  const invoiceNo = dn.invoice_no?.trim();
  const related = dn.related_dns ?? [];
  const comparison = dn.delivery_comparison ?? [];
  const dnColumns = dnColumnOrder(related, comparison);
  const relatedByDn = Object.fromEntries(related.map((r) => [r.dn_no, r]));

  if (!invoiceNo) {
    return (
      <p className="text-sm text-muted-foreground">
        No invoice linked — related DN comparison is not available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Invoice <span className="font-medium text-foreground">{invoiceNo}</span>
        {dn.sales_no ? (
          <>
            {" "}
            · Order{" "}
            <span className="font-medium text-foreground">{dn.sales_no}</span>
          </>
        ) : null}
        {" "}
        · {dnColumns.length} delivery note{dnColumns.length === 1 ? "" : "s"}
      </p>

      {comparison.length > 0 ? (
        <div className="border rounded-md overflow-hidden bg-white">
          <h3 className="px-4 py-2 text-sm font-semibold bg-muted/60 border-b">
            Invoice vs Delivered by DN
          </h3>
          <p className="px-4 py-2 text-xs text-muted-foreground border-b">
            Each DN column shows quantity and unit as entered. Total and
            variance use MT comparison (KG ÷ 1000 when invoice is MT).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left align-bottom">Item</th>
                  <th className="px-3 py-2 text-right align-bottom">Invoiced</th>
                  {dnColumns.map((dnNo) => {
                    const meta = relatedByDn[dnNo];
                    const isCurrent =
                      meta?.is_current ||
                      comparison[0]?.per_dn_deliveries?.find(
                        (p) => p.dn_no === dnNo,
                      )?.is_current;
                    return (
                      <th
                        key={dnNo}
                        className={`px-3 py-2 text-right align-bottom min-w-[100px] ${
                          isCurrent ? "bg-blue-50/80" : ""
                        }`}
                      >
                        <div className="font-semibold">
                          {isCurrent ? (
                            <span>{dnNo} (this)</span>
                          ) : (
                            <Link
                              href={`/diredawa/inventory/dn/${encodeURIComponent(dnNo)}`}
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {dnNo}
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
                    Total Delivered
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
                  const perDnMap = Object.fromEntries(
                    (row.per_dn_deliveries ?? []).map((p) => [p.dn_no, p]),
                  );

                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{row.item_name}</td>
                      <td className="px-3 py-2 text-right">
                        {formatInvoiced(
                          row.invoiced_quantity,
                          row.invoiced_unit,
                        )}
                      </td>
                      {dnColumns.map((dnNo) => {
                        const cell = perDnMap[dnNo];
                        const isCurrent = cell?.is_current;
                        return (
                          <td
                            key={`${idx}-${dnNo}`}
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
                        {formatQuantityDisplay(row.delivered_total)}
                        {row.comparison_unit
                          ? ` ${row.comparison_unit}`
                          : ""}
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
          No invoice line items to compare.
        </p>
      )}
    </div>
  );
}
