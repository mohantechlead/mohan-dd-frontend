"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";
import { amountInWords } from "@/lib/utils";

interface OrderItem {
  item_name: string;
  hs_code: string;
  price: number;
  quantity: number;
  total_price: number;
  measurement: string;
}

interface OrderDetail {
  id: string;
  order_number: string;
  order_date: string;
  buyer: string;
  buyer_address?: string | null;
  add_consignee?: string | null;
  proforma_ref_no: string;
  shipper: string;
  shipper_address?: string | null;
  notify_party?: string | null;
  add_notify_party?: string | null;
  country_of_origin: string;
  final_destination: string;
  port_of_loading: string;
  port_of_discharge: string;
  measurement_type?: string | null;
  payment_terms: string;
  mode_of_transport: string;
  freight?: string | null;
  shipment_type: string;
  status: string;
  items: OrderItem[];
}

export default function ProformaInvoicePage() {
  const params = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const orderNumber = params.orderNumber;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();

        if (!res.ok) {
          showToast({
            title: "Failed to load order",
            description:
              (data as any)?.detail ||
              (data as any)?.message ||
              "Please try again.",
            variant: "error",
          });
          return;
        }

        setOrder(data as OrderDetail);
      } catch {
        showToast({
          title: "Failed to load order",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber, showToast]);

  const totalPrice = useMemo(() => {
    if (!order) return 0;
    return order.items.reduce((sum, item) => sum + item.total_price, 0);
  }, [order]);

  return (
    <div
      className="max-w-6xl mx-auto py-8 space-y-8 bg-white font-poppins"
      data-print-doc="compact"
    >
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          onClick={() => router.push(`/diredawa/orders/${orderNumber}`)}
        >
          Back to Order Detail
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading proforma invoice...
        </p>
      ) : !order ? (
        <p className="text-center text-sm text-muted-foreground">
          Order not found.
        </p>
      ) : (
        <div className="relative space-y-8 pb-24">
          {/* Stamp and signature: right bottom corner */}
          <div className="absolute right-0 bottom-0 print:right-0 print:bottom-0 flex flex-col items-end gap-2">
            <Image
              src="/stamp.png"
              alt="Stamp"
              width={120}
              height={120}
              className="object-contain"
            />
            <Image
              src="/signature.png"
              alt="Signature"
              width={48}
              height={24}
              className="object-contain"
            />
          </div>
          {/* Header / Company info */}
          <div className="text-center space-y-1">
            <Image
              src="/logo.png"
              alt="Mohan PLC logo"
              width={80}
              height={80}
              className="mx-auto mb-3 print:h-28 print:w-28"
            />
            <h1 className="text-2xl font-semibold tracking-wide">Mohan PLC</h1>
            <p className="text-xs text-muted-foreground">
              Dire Dawa Free Trade Zone Branch
            </p>
            <p className="text-xs text-muted-foreground">
              Email: harsh@mohanint.com 
            </p>
            <p className="text-xs text-muted-foreground">
              TEL:+251-11-6621849
            </p>
          </div>

          <h1 className="text-2xl font-semibold text-center tracking-wide">
            Proforma Invoice
          </h1>

          <hr className="border-t" />

          {/* Rows 1 & 2 with 3 columns each */}

          {/* Row 1: Seller / Order / Proforma+Freight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            {/* Row1 Col1: Seller Details */}
            <div className="space-y-2">
              <p className="font-semibold">Seller Details</p>
              <p>MOHAN PLC DIRE DAWA FREE TRADE ZONE</p>
              <p>DIRE DAWA FREE TRADE ZONE</p>
            </div>

            {/* Row1 Col2: Order No + Invoice Date */}
            <div className="space-y-2">
              <div>
                <p className="font-semibold">Order No:</p>
                <p>{order.order_number}</p>
              </div>
              <div>
                <p className="font-semibold">Invoice Date:</p>
                <p>
                  {new Date(order.order_date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Row1 Col3: Proforma Invoice No + Freight + Shipment Type */}
            <div className="space-y-2">
              <div>
                <p className="font-semibold">Proforma Invoice No:</p>
                <p>{order.proforma_ref_no}</p>
              </div>
              <div>
                <p className="font-semibold">Freight</p>
                <p>{order.freight ?? "—"}</p>
              </div>
              <div>
                <p className="font-semibold">Shipment Type</p>
                <p>{order.shipment_type}</p>
              </div>
            </div>
          </div>

          {/* Row 2: Buyer / Ports / Country+Destination+Payment+Shipment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            {/* Row2 Col1: Buyer Details */}
            <div className="space-y-1">
              <p className="font-semibold mb-1">Buyer Details</p>
              <p className="uppercase">{order.buyer}</p>
              <div>
                <p className="text-[11px] text-muted-foreground">
                  {order.buyer_address?.trim() || order.add_consignee?.trim() || "—"}
                </p>
              </div>
            </div>

            {/* Row2 Col2: Ports + Means of Transport */}
            <div className="space-y-2">
              <div>
                <p className="font-semibold">Port of Loading</p>
                <p>{order.port_of_loading}</p>
              </div>
              <div>
                <p className="font-semibold">Port Of Discharge</p>
                <p>{order.port_of_discharge}</p>
              </div>
              <div>
                <p className="font-semibold">Means of Transport</p>
                <p>{order.mode_of_transport}</p>
              </div>
            </div>

            {/* Row2 Col3: Country / Final Destination / Payment / Shipment Terms / Shipper */}
            <div className="space-y-2">
              {order.shipper_address && (
                <div>
                  <p className="font-semibold">Shipper Address</p>
                  <p className="text-[11px] text-muted-foreground">
                    {order.shipper_address}
                  </p>
                </div>
              )}
              <div>
                <p className="font-semibold">Country of Origin</p>
                <p>{order.country_of_origin}</p>
              </div>
              <div>
                <p className="font-semibold">Final Destination</p>
                <p>{order.final_destination}</p>
              </div>
              <div>
                <p className="font-semibold">Payment Terms</p>
                <p>{order.payment_terms}</p>
              </div>
              <div>
                <p className="font-semibold">Shipment Terms</p>
                <p>{order.shipment_type}</p>
              </div>
            </div>
          </div>

          {/* Order summary table */}
          <div className="mt-4">
            <p className="text-xs font-semibold mb-2 tracking-wide">Order Summary</p>
            <table className="w-full text-xs border-b">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-2 py-2 w-10">No.</th>
                  <th className="px-2 py-2">Item</th>

                  <th className="px-2 py-2 text-right">
                    <div>Price in</div>
                    <div>USD</div>
                  </th>

                  <th className="px-2 py-2 text-right">Quantity</th>

                  <th className="px-2 py-2">
                    <div>Unit of</div>
                    <div>Measurement</div>
                  </th>

                  <th className="px-2 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className="border-b align-top">
                    <td className="px-2 py-2 text-left">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-2 py-2">
                      <div>{item.item_name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        HS-code:{item.hs_code}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right">
                      ${item.price.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-2 py-2 text-right">{item.quantity}</td>
                    <td className="px-2 py-2">{order.measurement_type ?? item.measurement}</td>
                    <td className="px-2 py-2 text-right">
                      ${item.total_price.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="px-2 py-2 font-semibold" colSpan={5}>
                    Total
                    <span className="ml-4 text-[10px] text-muted-foreground">
                      Amount in Words: USD {amountInWords(totalPrice)} ONLY
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right font-semibold">
                    ${totalPrice.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Conditions & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs mt-6">
            <div className="space-y-1">
              <p className="font-semibold">Conditions</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Partial Shipment to be allowed</li>
                <li>Transshipment to be allowed</li>
                <li>Cargo subject to availability</li>
                <li>
                  Buyer shall be responsible for all payments outside Dire Dawa
                  Free Trade Zone, and must pay all duties and taxes as per the
                  laws and regulations of the Federal Democratic Republic of
                  Ethiopia.
                </li>
              </ol>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Payment must be remitted to:</p>
              <p>Beneficiary: Mohan PLC</p>
              <p className="mt-2 font-semibold">Beneficiary Bank details:</p>
              <p>BANK NAME: COMMERCIAL BANK OF ETHIOPIA</p>
              <p>SWIFT: CBETETAA</p>
              <p>Account Number: 1000679266407</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

