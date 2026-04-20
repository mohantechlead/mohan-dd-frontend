"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { amountInWords } from "@/lib/utils";

interface PurchaseItem {
  purchase_number: string;
  item_name: string;
  price: number;
  quantity: number;
  remaining: number;
  total_price: number;
  before_vat?: number;
  hscode?: string | null;
  measurement: string;
}

interface PurchaseDetail {
  id: string;
  purchase_number: string;
  order_date: string;
  buyer: string;
  buyer_address?: string | null;
  add_consignee?: string | null;
  shipper: string;
  shipper_address?: string | null;
  proforma_ref_no: string;
  port_of_loading?: string | null;
  port_of_discharge?: string | null;
  mode_of_transport?: string | null;
  country_of_origin?: string | null;
  final_destination?: string | null;
  payment_type?: string | null;
  // legacy fallback (older API responses / other UI parts)
  payment_terms?: string | null;
  freight?: string | null;
  shipment_type?: string | null;
  items: PurchaseItem[];
}

const ITEMS_API_URL = "/api/inventory/items";

export default function PurchaseOrderPage() {
  const params = useParams<{ purchaseNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const purchaseNumber = params.purchaseNumber;
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemOptions, setItemOptions] = useState<{ item_name: string; hscode: string }[]>([]);

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const res = await fetch(
          `/api/purchases/${encodeURIComponent(purchaseNumber)}`
        );
        const data: unknown = await res.json();
        if (!res.ok) {
          showToast({
            title: "Failed to load purchase",
            description:
              (data as { detail?: string })?.detail || "Please try again.",
            variant: "error",
          });
          return;
        }
        setPurchase(data as PurchaseDetail);
      } catch {
        showToast({
          title: "Failed to load purchase",
          description: "Something went wrong.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    const fetchItems = async () => {
      try {
        const res = await fetch(ITEMS_API_URL);
        if (!res.ok) return;
        const data = await res.json();
        setItemOptions(
          (data as { item_name: string; hscode: string }[]).map((i) => ({
            item_name: i.item_name,
            hscode: i.hscode || "",
          }))
        );
      } catch {
        // ignore
      }
    };
    if (purchaseNumber) {
      fetchPurchase();
      fetchItems();
    }
  }, [purchaseNumber, showToast]);

  useEffect(() => {
    const previousTitle = document.title;

    const setPrintTitleBlank = () => {
      document.title = "";
    };

    const restoreTitle = () => {
      document.title = previousTitle;
    };

    // Keep tab title clean while on this route.
    setPrintTitleBlank();

    // Ensure title is blank exactly at print time in case Next/head rewrites it.
    window.addEventListener("beforeprint", setPrintTitleBlank);
    window.addEventListener("afterprint", restoreTitle);

    return () => {
      window.removeEventListener("beforeprint", setPrintTitleBlank);
      window.removeEventListener("afterprint", restoreTitle);
      document.title = previousTitle;
    };
  }, []);

  const totalPrice = useMemo(
    () =>
      purchase
        ? purchase.items.reduce((s, i) => s + i.total_price, 0)
        : 0,
    [purchase]
  );

  const getHsCode = (itemName: string) =>
    itemOptions.find(
      (o) => o.item_name.toLowerCase() === itemName.toLowerCase()
    )?.hscode ?? "";

  return (
    <div
      className="max-w-5xl mx-auto py-8 space-y-8 bg-white font-poppins"
    >
      <style jsx global>{`
        @media print {
          html:has(#purchase-order-print-content),
          html:has(#purchase-order-print-content) body {
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          @page {
            margin: 0;
          }

          #purchase-order-print-content {
            max-width: 100% !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            line-height: 1.2 !important;
          }

          #purchase-order-print-content h1 {
            font-size: 20pt !important;
          }

          #purchase-order-print-content h2 {
            font-size: 16pt !important;
          }

          #purchase-order-print-content h3 {
            font-size: 12pt !important;
          }

          #purchase-order-print-content .text-xs {
            font-size: 10.5pt !important;
          }

          #purchase-order-print-content table th,
          #purchase-order-print-content table td {
            font-size: 10.5pt !important;
            padding-top: 3px !important;
            padding-bottom: 3px !important;
          }

          /* Start print content exactly from logo section. */
          #purchase-order-print-content > :first-child {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
        }
      `}</style>
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          onClick={() => router.push(`/diredawa/purchase/${purchaseNumber}`)}
        >
          Back to Purchase Detail
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading...
        </p>
      ) : !purchase ? (
        <p className="text-center text-sm text-muted-foreground">
          Purchase not found.
        </p>
      ) : (
        <div id="purchase-order-print-content" className="space-y-6">
          {/* Header: logo + company */}
          <div className="text-center space-y-1">
            <Image
              src="/logo.png"
              alt="Mohan PLC logo"
              width={80}
              height={80}
              className="mx-auto mb-3"
            />
            <h1 className="text-2xl font-semibold tracking-wide">
              Mohan PLC
            </h1>
            <p className="text-xs text-muted-foreground">
              Dire Dawa Free Trade Zone Branch
            </p>
            <p className="text-xs text-muted-foreground">
              Email: harsh@mohanint.com
            </p>
            <p className="text-xs text-muted-foreground">
              Tel: +251-11-6621849
            </p>
          </div>

          {/* Document title */}
          <h2 className="text-xl font-semibold text-center tracking-wide">
            Purchase Order
          </h2>

          {/* Two rows, three columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Row 1 */}
            <div className="space-y-1">
              <p className="font-semibold">Seller Details</p>
              <p className="uppercase text-muted-foreground">{purchase.shipper}</p>
              {purchase.shipper_address && (
                <p className="text-muted-foreground">{purchase.shipper_address}</p>
              )}
              <p className="text-muted-foreground">
                {purchase.add_consignee ?? "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Purchase No:</p>
              <p className="text-muted-foreground">{purchase.purchase_number}</p>
              <p className="font-semibold mt-2">Invoice Date:</p>
              <p className="text-muted-foreground">
                {new Date(purchase.order_date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">PFI No:</p>
              <p className="text-muted-foreground">{purchase.proforma_ref_no}</p>
            </div>
          </div>

          <hr className="border-t my-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Row 2 */}
            <div className="space-y-1">
              <p className="font-semibold">Buyer Details</p>
              <p className="text-muted-foreground">
                MOHAN PLC, DIRE DAWA FREE TRADE ZONE
              </p>
              <p className="text-muted-foreground">
                DIRE DAWA FREE TRADE ZONE
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Port of Loading</p>
              <p className="text-muted-foreground">{purchase.port_of_loading ?? "—"}</p>
              <p className="font-semibold mt-2">Port Of Discharge</p>
              <p className="text-muted-foreground">{purchase.port_of_discharge ?? "—"}</p>
              <p className="font-semibold mt-2">Means of Transport</p>
              <p className="text-muted-foreground">{purchase.mode_of_transport ?? "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Country of Origin</p>
              <p className="text-muted-foreground">{purchase.country_of_origin ?? "—"}</p>
              <p className="font-semibold mt-2">Final Destination</p>
              <p className="text-muted-foreground">{purchase.final_destination ?? "—"}</p>
              <p className="font-semibold mt-2">Payment Type</p>
              <p className="text-muted-foreground">{purchase.payment_type ?? purchase.payment_terms ?? "—"}</p>
              <p className="font-semibold mt-2">Shipment Terms</p>
              <p className="text-muted-foreground">{purchase.shipment_type ?? "—"}</p>
              <p className="font-semibold mt-2">Freight</p>
              <p className="text-muted-foreground">{purchase.freight ?? "—"}</p>
              <p className="font-semibold mt-2">Shipment Type</p>
              <p className="text-muted-foreground">{purchase.shipment_type ?? "—"}</p>
            </div>
          </div>

          {/* Order Summary table */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Order Summary</h3>
            <table className="w-full text-xs border-t border-b">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-2 text-left w-10">No.</th>
                  <th className="px-2 py-2 text-left w-24">Purchase No.</th>
                  <th className="px-2 py-2 text-left">Item</th>
                  <th className="px-2 py-2 text-left w-20">HS Code</th>
                  <th className="px-2 py-2 text-right w-28">Price in USD</th>
                  <th className="px-2 py-2 text-right w-20">Quantity</th>
                  <th className="px-2 py-2 text-right w-20">Remaining</th>
                  <th className="px-2 py-2 text-left w-24">Unit of Measurement</th>
                  <th className="px-2 py-2 text-right w-28">Total</th>
                  <th className="px-2 py-2 text-right w-28">Before VAT</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item, index) => {
                  const hsCode =
                    item.hscode?.trim() || getHsCode(item.item_name) || "";
                  return (
                    <tr key={index} className="border-b align-top">
                      <td className="px-2 py-2">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td className="px-2 py-2 font-mono text-[10px]">
                        {item.purchase_number}
                      </td>
                      <td className="px-2 py-2">
                        <div>{item.item_name}</div>
                      </td>
                      <td className="px-2 py-2 font-mono text-[10px]">
                        {hsCode || "—"}
                      </td>
                      <td className="px-2 py-2 text-right">
                        ${item.price.toLocaleString(undefined, {
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {item.quantity.toLocaleString(undefined, {
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {(item.remaining ?? item.quantity).toLocaleString(
                          undefined,
                          { maximumFractionDigits: 3 }
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {item.measurement || "—"}
                      </td>
                      <td className="px-2 py-2 text-right">
                        ${item.total_price.toLocaleString(undefined, {
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {(item.before_vat ?? item.total_price).toLocaleString(
                          undefined,
                          { maximumFractionDigits: 3 }
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-b font-semibold">
                  <td className="px-2 py-2" colSpan={5}>
                    <span>Total</span>
                    <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                      Amount in Words: USD {amountInWords(totalPrice)} ONLY
                    </span>
                  </td>
                  <td className="px-2 py-2" colSpan={4} />
                  <td className="px-2 py-2 text-right">
                    ${totalPrice.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
