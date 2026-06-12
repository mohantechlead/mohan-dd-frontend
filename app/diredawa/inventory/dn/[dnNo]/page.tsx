"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatQuantityDisplay } from "@/lib/inventoryQuantity";
import {
  DnInvoiceInsightPanel,
  type DnRelated,
} from "@/components/dn-invoice-insight";

interface DnItem {
  code?: string | null;
  item_name: string;
  quantity: number;
  unit_measurement?: string | null;
  internal_code?: string | null;
}

interface OverUnderItem {
  item_name: string;
  invoiced: number;
  delivered: number;
  variance: number;
  unit?: string | null;
}

interface InvoiceItem {
  item_name: string;
  quantity: number;
  measurement?: string | null;
  code?: string | null;
}

interface DeliveryComparisonRow {
  item_name: string;
  invoiced_quantity: number;
  invoiced_unit?: string | null;
  delivered_total: number;
  this_dn_quantity: number;
  this_dn_unit?: string | null;
  comparison_unit?: string | null;
  variance: number;
}

const qtyLabel = (unit?: string | null) =>
  unit?.trim() ? ` (${unit.trim()})` : "";

const formatInvoiced = (qty: number, unit?: string | null) =>
  `${formatQuantityDisplay(qty)}${unit?.trim() ? ` ${unit.trim()}` : ""}`;

interface DnDetail {
  id: string;
  dn_no: string;
  customer_name: string;
  sales_no: string;
  plate_no?: string | null;
  date?: string | null;
  ECD_no?: string | null;
  invoice_no?: string | null;
  gatepass_no?: string | null;
  despathcher_name?: string | null;
  receiver_name?: string | null;
  authorized_by?: string | null;
  remark?: string | null;
  is_last?: boolean;
  items: DnItem[];
  invoice_items?: InvoiceItem[];
  related_dns?: DnRelated[];
  delivery_comparison?: DeliveryComparisonRow[];
  over_items?: OverUnderItem[];
  under_items?: OverUnderItem[];
}

const DN_API_URL = "/api/inventory/dn";

export default function DnDetailPage() {
  const params = useParams<{ dnNo: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const dnNo = params.dnNo;

  const [dn, setDn] = useState<DnDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDn = async () => {
      if (!dnNo) return;
      try {
        const res = await fetch(`${DN_API_URL}/${encodeURIComponent(dnNo)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data: unknown = await res.json();

        if (!res.ok) {
          showToast({
            title: "Failed to load Delivery Note",
            description:
              (data as { detail?: string })?.detail || "Please try again.",
            variant: "error",
          });
          return;
        }
        setDn(data as DnDetail);
      } catch {
        showToast({
          title: "Failed to load Delivery Note",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDn();
  }, [dnNo, showToast]);

  return (
    <div className="max-w-6xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/diredawa/inventory/dn/display")}
        >
          Back to DN List
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold">Delivery Note Detail</h1>
          {dn && (
            <p className="text-sm text-muted-foreground mt-1">
              Last delivery for this invoice:{" "}
              <span
                className={
                  dn.is_last
                    ? "font-semibold text-green-700"
                    : "font-medium text-muted-foreground"
                }
              >
                {dn.is_last ? "Yes" : "No"}
              </span>
            </p>
          )}
        </div>
        <div className="w-[120px]" />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading delivery note...
        </p>
      ) : !dn ? (
        <p className="text-center text-sm text-muted-foreground">
          Delivery note not found.
        </p>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left">Delivery No</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Customer Name</th>
                  <th className="px-4 py-2 text-left">Sales No</th>
                  <th className="px-4 py-2 text-left">Plate No</th>
                  <th className="px-4 py-2 text-left">Last for Invoice</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 font-medium">{dn.dn_no}</td>
                  <td className="px-4 py-2">
                    {dn.date
                      ? new Date(dn.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{dn.customer_name}</td>
                  <td className="px-4 py-2">{dn.sales_no}</td>
                  <td className="px-4 py-2">{dn.plate_no || "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        dn.is_last
                          ? "inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800"
                          : "inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {dn.is_last ? "Yes" : "No"}
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
                    Invoice No
                  </td>
                  <td className="px-4 py-2">{dn.invoice_no || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">ECD No</td>
                  <td className="px-4 py-2">{dn.ECD_no || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Gatepass No
                  </td>
                  <td className="px-4 py-2">{dn.gatepass_no || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Dispatcher Name
                  </td>
                  <td className="px-4 py-2">{dn.despathcher_name || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Receiver Name
                  </td>
                  <td className="px-4 py-2">{dn.receiver_name || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Authorized By
                  </td>
                  <td className="px-4 py-2">{dn.authorized_by || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground align-top">
                    Remark
                  </td>
                  <td className="px-4 py-2 whitespace-pre-wrap">
                    {dn.remark?.trim() ? dn.remark : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {(dn.invoice_items?.length ?? 0) > 0 && (
            <div className="border rounded-md overflow-hidden bg-white">
              <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
                Invoiced on Shipping Invoice
                {dn.invoice_no ? ` (${dn.invoice_no})` : ""}
              </h2>
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2 text-left">Item Name</th>
                    <th className="px-4 py-2 text-right">Invoiced Qty</th>
                    <th className="px-4 py-2 text-left">Unit</th>
                    <th className="px-4 py-2 text-left">Code</th>
                  </tr>
                </thead>
                <tbody>
                  {dn.invoice_items?.map((item, idx) => (
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
              Delivered on This DN ({dn.items?.length ?? 0} lines)
            </h2>
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-2 text-left">Item Name</th>
                  <th className="px-4 py-2 text-right">Invoiced</th>
                  <th className="px-4 py-2 text-right">This DN Qty</th>
                  <th className="px-4 py-2 text-left">Unit</th>
                  <th className="px-4 py-2 text-left">Code</th>
                </tr>
              </thead>
              <tbody>
                {dn.items?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-4 text-muted-foreground text-center"
                    >
                      No items
                    </td>
                  </tr>
                ) : (
                  dn.items?.map((item, idx) => {
                    const comparison = dn.delivery_comparison?.find(
                      (row) =>
                        row.item_name.toLowerCase() ===
                        item.item_name.toLowerCase(),
                    );
                    return (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2">{item.item_name}</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">
                          {comparison
                            ? formatInvoiced(
                                comparison.invoiced_quantity,
                                comparison.invoiced_unit,
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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {dn.invoice_no?.trim() ? (
            <div className="border rounded-md overflow-hidden bg-white p-4">
              <h2 className="text-base font-semibold mb-3">
                Related DNs &amp; invoice variance
              </h2>
              <DnInvoiceInsightPanel dn={dn} />
            </div>
          ) : null}

          {(dn.over_items?.length ?? 0) > 0 && (
            <div className="border rounded-md overflow-hidden bg-white border-amber-200">
              <h2 className="px-4 py-2 font-semibold bg-amber-50 border-b">
                Over Delivery
              </h2>
              <table className="w-full text-sm">
                <thead className="bg-amber-50/60">
                  <tr>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-right">
                      Invoiced
                      {qtyLabel(dn.over_items?.[0]?.unit)}
                    </th>
                    <th className="px-4 py-2 text-right">
                      Delivered
                      {qtyLabel(dn.over_items?.[0]?.unit)}
                    </th>
                    <th className="px-4 py-2 text-right">
                      Difference
                      {qtyLabel(dn.over_items?.[0]?.unit)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dn.over_items?.map((item, idx) => (
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

          {(dn.under_items?.length ?? 0) > 0 && (
            <div className="border rounded-md overflow-hidden bg-white border-red-200">
              <h2 className="px-4 py-2 font-semibold bg-red-50 border-b">
                Under Delivery
              </h2>
              <table className="w-full text-sm">
                <thead className="bg-red-50/60">
                  <tr>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-right">
                      Invoiced
                      {qtyLabel(dn.under_items?.[0]?.unit)}
                    </th>
                    <th className="px-4 py-2 text-right">
                      Delivered
                      {qtyLabel(dn.under_items?.[0]?.unit)}
                    </th>
                    <th className="px-4 py-2 text-right">
                      Difference
                      {qtyLabel(dn.under_items?.[0]?.unit)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dn.under_items?.map((item, idx) => (
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
                router.push(`/diredawa/orders/${dn.sales_no}`)
              }
            >
              View Order
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
