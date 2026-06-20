"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatQuantityDisplay } from "@/lib/inventoryQuantity";
import {
  GrnPurchaseInsightPanel,
  type GrnRelated,
} from "@/components/grn-purchase-insight";

interface GrnItem {
  code?: string | null;
  item_name: string;
  quantity: number;
  unit_measurement?: string | null;
  internal_code?: string | null;
  bags?: number | null;
}

interface OverUnderItem {
  item_name: string;
  invoiced: number;
  delivered: number;
  variance: number;
  unit?: string | null;
}

interface PurchaseItem {
  item_name: string;
  quantity: number;
  measurement?: string | null;
  code?: string | null;
}

interface ReceiptComparisonRow {
  item_name: string;
  ordered_quantity: number;
  ordered_unit?: string | null;
  received_total: number;
  this_grn_quantity: number;
  this_grn_unit?: string | null;
  comparison_unit?: string | null;
  variance: number;
}

const qtyLabel = (unit?: string | null) =>
  unit?.trim() ? ` (${unit.trim()})` : "";

const formatOrdered = (qty: number, unit?: string | null) =>
  `${formatQuantityDisplay(qty)}${unit?.trim() ? ` ${unit.trim()}` : ""}`;

interface GrnDetail {
  id: string;
  grn_no: string;
  supplier_name: string;
  received_from?: string | null;
  truck_no?: string | null;
  total_quantity?: number | null;
  store_name?: string | null;
  store_keeper?: string | null;
  purchase_no: string;
  date?: string | null;
  ECD_no?: string | null;
  transporter_name?: string | null;
  remark?: string | null;
  is_last?: boolean;
  items: GrnItem[];
  purchase_items?: PurchaseItem[];
  related_grns?: GrnRelated[];
  receipt_comparison?: ReceiptComparisonRow[];
  over_items?: OverUnderItem[];
  under_items?: OverUnderItem[];
}

const GRN_API_URL = "/api/inventory/grn";

export default function GrnDetailPage() {
  const params = useParams<{ grnNo: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const grnNo = params.grnNo;

  const [grn, setGrn] = useState<GrnDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrn = async () => {
      if (!grnNo) return;
      try {
        const res = await fetch(`${GRN_API_URL}/${encodeURIComponent(grnNo)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data: unknown = await res.json();

        if (!res.ok) {
          showToast({
            title: "Failed to load GRN",
            description:
              (data as { detail?: string })?.detail || "Please try again.",
            variant: "error",
          });
          return;
        }
        setGrn(data as GrnDetail);
      } catch {
        showToast({
          title: "Failed to load GRN",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchGrn();
  }, [grnNo, showToast]);

  return (
    <div className="max-w-6xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/diredawa/inventory/grn/display")}
        >
          Back to GRN List
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold">GRN Detail</h1>
          {grn && (
            <p className="text-sm text-muted-foreground mt-1">
              Last receipt for this purchase:{" "}
              <span
                className={
                  grn.is_last
                    ? "font-semibold text-green-700"
                    : "font-medium text-muted-foreground"
                }
              >
                {grn.is_last ? "Yes" : "No"}
              </span>
            </p>
          )}
        </div>
        <div className="w-[120px]" />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading GRN...
        </p>
      ) : !grn ? (
        <p className="text-center text-sm text-muted-foreground">
          GRN not found.
        </p>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left">GRN No</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Supplier Name</th>
                  <th className="px-4 py-2 text-left">Purchase No</th>
                  <th className="px-4 py-2 text-left">Truck No</th>
                  <th className="px-4 py-2 text-left">Last for Purchase</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 font-medium">{grn.grn_no}</td>
                  <td className="px-4 py-2">
                    {grn.date
                      ? new Date(grn.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{grn.supplier_name}</td>
                  <td className="px-4 py-2">{grn.purchase_no}</td>
                  <td className="px-4 py-2">{grn.truck_no || "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        grn.is_last
                          ? "inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800"
                          : "inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {grn.is_last ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border rounded-md overflow-hidden bg-white">
            <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
              Additional Details
            </h2>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="px-4 py-2 text-muted-foreground w-48">
                    Received From
                  </td>
                  <td className="px-4 py-2">{grn.received_from || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground w-48">
                    Total Quantity
                  </td>
                  <td className="px-4 py-2">
                    {formatQuantityDisplay(grn.total_quantity ?? null)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground w-48">
                    ECD No
                  </td>
                  <td className="px-4 py-2">{grn.ECD_no || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Transporter Name
                  </td>
                  <td className="px-4 py-2">{grn.transporter_name || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Store Name
                  </td>
                  <td className="px-4 py-2">{grn.store_name || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Store Keeper
                  </td>
                  <td className="px-4 py-2">{grn.store_keeper || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground align-top">
                    Remark
                  </td>
                  <td className="px-4 py-2 whitespace-pre-wrap">
                    {grn.remark?.trim() ? grn.remark : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {(grn.purchase_items?.length ?? 0) > 0 && (
            <div className="border rounded-md overflow-hidden bg-white">
              <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
                Ordered on Purchase
                {grn.purchase_no ? ` (${grn.purchase_no})` : ""}
              </h2>
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2 text-left">Item Name</th>
                    <th className="px-4 py-2 text-right">Ordered Qty</th>
                    <th className="px-4 py-2 text-left">Unit</th>
                    <th className="px-4 py-2 text-left">Code</th>
                  </tr>
                </thead>
                <tbody>
                  {grn.purchase_items?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{item.item_name}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatQuantityDisplay(item.quantity)}
                      </td>
                      <td className="px-4 py-2">
                        {item.measurement?.trim() || "—"}
                      </td>
                      <td className="px-4 py-2">{item.code?.trim() || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border rounded-md overflow-hidden bg-white">
            <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
              Received on This GRN ({grn.items?.length ?? 0} lines)
            </h2>
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-2 text-left">Item Name</th>
                  <th className="px-4 py-2 text-right">Ordered</th>
                  <th className="px-4 py-2 text-right">This GRN Qty</th>
                  <th className="px-4 py-2 text-left">Unit</th>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-right">Bags</th>
                </tr>
              </thead>
              <tbody>
                {grn.items?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-4 text-muted-foreground text-center"
                    >
                      No items
                    </td>
                  </tr>
                ) : (
                  grn.items?.map((item, idx) => {
                    const comparison = grn.receipt_comparison?.find(
                      (row) =>
                        row.item_name.toLowerCase() ===
                        item.item_name.toLowerCase(),
                    );
                    return (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2">{item.item_name}</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">
                          {comparison
                            ? formatOrdered(
                                comparison.ordered_quantity,
                                comparison.ordered_unit,
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatQuantityDisplay(item.quantity)}
                        </td>
                        <td className="px-4 py-2">
                          {item.unit_measurement || "—"}
                        </td>
                        <td className="px-4 py-2">
                          {item.code || item.internal_code || "—"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {item.bags != null
                            ? formatQuantityDisplay(item.bags)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {grn.purchase_no?.trim() ? (
            <div className="border rounded-md overflow-hidden bg-white p-4">
              <h2 className="text-base font-semibold mb-3">
                Related GRNs &amp; purchase variance
              </h2>
              <GrnPurchaseInsightPanel grn={grn} />
            </div>
          ) : null}

          {(grn.over_items?.length ?? 0) > 0 && (
            <div className="border rounded-md overflow-hidden bg-white border-amber-200">
              <h2 className="px-4 py-2 font-semibold bg-amber-50 border-b">
                Over Receipt
              </h2>
              <table className="w-full text-sm">
                <thead className="bg-amber-50/60">
                  <tr>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-right">
                      Ordered
                      {qtyLabel(grn.over_items?.[0]?.unit)}
                    </th>
                    <th className="px-4 py-2 text-right">
                      Received
                      {qtyLabel(grn.over_items?.[0]?.unit)}
                    </th>
                    <th className="px-4 py-2 text-right">
                      Difference
                      {qtyLabel(grn.over_items?.[0]?.unit)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grn.over_items?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{item.item_name}</td>
                      <td className="px-4 py-2 text-right">
                        {formatQuantityDisplay(item.invoiced)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatQuantityDisplay(item.delivered)}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-amber-600">
                        +{formatQuantityDisplay(item.variance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(grn.under_items?.length ?? 0) > 0 && (
            <div className="border rounded-md overflow-hidden bg-white border-red-200">
              <h2 className="px-4 py-2 font-semibold bg-red-50 border-b">
                Under Receipt
              </h2>
              <table className="w-full text-sm">
                <thead className="bg-red-50/60">
                  <tr>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-right">
                      Ordered
                      {qtyLabel(grn.under_items?.[0]?.unit)}
                    </th>
                    <th className="px-4 py-2 text-right">
                      Received
                      {qtyLabel(grn.under_items?.[0]?.unit)}
                    </th>
                    <th className="px-4 py-2 text-right">
                      Difference
                      {qtyLabel(grn.under_items?.[0]?.unit)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grn.under_items?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{item.item_name}</td>
                      <td className="px-4 py-2 text-right">
                        {formatQuantityDisplay(item.invoiced)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatQuantityDisplay(item.delivered)}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-red-600">
                        −{formatQuantityDisplay(item.variance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/diredawa/purchase/${grn.purchase_no}`)
              }
            >
              View Purchase
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
