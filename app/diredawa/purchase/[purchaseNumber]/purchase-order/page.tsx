"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface PurchaseItem {
  item_name: string;
  price: number;
  quantity: number;
  total_price: number;
  measurement: string;
}

interface PurchaseDetail {
  id: string;
  purchase_number: string;
  order_date: string;
  buyer: string;
  add_consignee?: string | null;
  shipper: string;
  proforma_ref_no: string;
  port_of_loading?: string | null;
  port_of_discharge?: string | null;
  mode_of_transport?: string | null;
  country_of_origin?: string | null;
  final_destination?: string | null;
  payment_terms?: string | null;
  shipment_type?: string | null;
  items: PurchaseItem[];
}

const ITEMS_API_URL = "/api/inventory/items";

/** Simple number-to-words for whole USD amounts (up to millions). */
function amountInWords(n: number): string {
  const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  const teens = ["TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const whole = Math.round(n);
  if (whole === 0) return "ZERO";
  if (whole < 0 || whole >= 1e9) return whole.toLocaleString();

  function upTo99(x: number): string {
    if (x < 10) return ones[x];
    if (x < 20) return teens[x - 10];
    const t = Math.floor(x / 10);
    const o = x % 10;
    return tens[t] + (o ? " " + ones[o] : "");
  }
  function upTo999(x: number): string {
    if (x < 100) return upTo99(x);
    const h = Math.floor(x / 100);
    const r = x % 100;
    return ones[h] + " HUNDRED" + (r ? " " + upTo99(r) : "");
  }
  function upTo999999(x: number): string {
    if (x < 1000) return upTo999(x);
    const th = Math.floor(x / 1000);
    const r = x % 1000;
    return upTo999(th) + " THOUSAND" + (r ? " " + upTo999(r) : "");
  }
  function upTo999999999(x: number): string {
    if (x < 1e6) return upTo999999(x);
    const m = Math.floor(x / 1e6);
    const r = x % 1e6;
    return upTo999(m) + " MILLION" + (r ? " " + upTo999999(r) : "");
  }
  return upTo999999999(whole);
}

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
    <div className="max-w-5xl mx-auto py-8 space-y-8 bg-white">
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
        <div className="space-y-6">
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
              <p className="font-semibold mt-2">Payment Terms</p>
              <p className="text-muted-foreground">{purchase.payment_terms ?? "—"}</p>
              <p className="font-semibold mt-2">Shipment Terms</p>
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
                  <th className="px-2 py-2 text-left">Item</th>
                  <th className="px-2 py-2 text-right w-28">Price in USD</th>
                  <th className="px-2 py-2 text-right w-20">Quantity</th>
                  <th className="px-2 py-2 text-left w-24">Unit of Measurement</th>
                  <th className="px-2 py-2 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item, index) => {
                  const hsCode = getHsCode(item.item_name);
                  return (
                    <tr key={index} className="border-b align-top">
                      <td className="px-2 py-2">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td className="px-2 py-2">
                        <div>{item.item_name}</div>
                        {hsCode && (
                          <div className="text-[10px] text-muted-foreground">
                            HS-code: {hsCode}
                          </div>
                        )}
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
                      <td className="px-2 py-2">
                        {item.measurement || "—"}
                      </td>
                      <td className="px-2 py-2 text-right">
                        ${item.total_price.toLocaleString(undefined, {
                          maximumFractionDigits: 3,
                        })}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-b font-semibold">
                  <td className="px-2 py-2" colSpan={2}>
                    <span>Total</span>
                    <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                      Amount in Words: USD {amountInWords(totalPrice)} ONLY
                    </span>
                  </td>
                  <td className="px-2 py-2" colSpan={2} />
                  <td className="px-2 py-2" />
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
