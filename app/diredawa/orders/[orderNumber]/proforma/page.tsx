"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

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
  add_consignee?: string | null;
  proforma_ref_no: string;
  shipper: string;
  notify_party?: string | null;
  add_notify_party?: string | null;
  country_of_origin: string;
  final_destination: string;
  port_of_loading: string;
  port_of_discharge: string;
  payment_terms: string;
  mode_of_transport: string;
  freight: string;
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
    <div className="max-w-6xl mx-auto py-8 space-y-8 bg-white">
      <div className="flex items-center justify-between">
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
        <div className="space-y-8">
          {/* Header / Company info */}
          <div className="text-center space-y-1">
            {/* Logo placeholder */}
            <div className="mx-auto mb-3 h-16 w-16 rounded-full border flex items-center justify-center text-xs tracking-[0.3em]">
              MOHAN
            </div>
            <h1 className="text-2xl font-semibold tracking-wide">Mohan PLC</h1>
            <p className="text-xs text-muted-foreground">
              Dire Dawa Free Trade Zone Branch
            </p>
            <p className="text-xs text-muted-foreground">
              Email: harsh@mohanint.com &nbsp; TEL:+251-11-6621849
            </p>
          </div>

          <h2 className="text-xl font-semibold text-center tracking-wide">
            Proforma Invoice
          </h2>

          {/* Seller / Buyer / Header columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            <div className="space-y-2">
              <p className="font-semibold">Seller Details</p>
              <p>Mohan PLC, Dire Dawa Free Trade Zone</p>
              <p>Dire Dawa Free Trade Zone</p>

              <div className="mt-4 space-y-1">
                <p className="font-semibold">Buyer Details</p>
                <p className="uppercase">{order.buyer}</p>
                {order.add_consignee && <p>{order.add_consignee}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold">Order No:</span>
                <span>{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Invoice Date:</span>
                <span>
                  {new Date(order.order_date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold">Proforma Invoice No:</span>
                <span>{order.proforma_ref_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Freight</span>
                <span>{order.freight}</span>
              </div>
            </div>
          </div>

          <hr className="border-t" />

          {/* Shipment / route info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            <div className="space-y-1">
              <p className="font-semibold">Port of Loading</p>
              <p>{order.port_of_loading}</p>

              <p className="font-semibold mt-3">Port Of Discharge</p>
              <p>{order.port_of_discharge}</p>

              <p className="font-semibold mt-3">Means of Transport</p>
              <p>{order.mode_of_transport}</p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Country of Origin</p>
              <p>{order.country_of_origin}</p>

              <p className="font-semibold mt-3">Final Destination</p>
              <p>{order.final_destination}</p>

              <p className="font-semibold mt-3">Payment Terms</p>
              <p>{order.payment_terms}</p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Shipment Terms</p>
              <p>{order.shipment_type}</p>
            </div>
          </div>

          {/* Order summary table */}
          <div className="mt-4">
            <p className="text-sm font-semibold mb-2">Order Summary</p>
            <table className="w-full text-xs border-t">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-2 text-left w-12">No.</th>
                  <th className="px-2 py-2 text-left">Item</th>
                  <th className="px-2 py-2 text-right">Price in USD</th>
                  <th className="px-2 py-2 text-right">Quantity</th>
                  <th className="px-2 py-2 text-left">Unit of Measurement</th>
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
                    <td className="px-2 py-2">{item.measurement}</td>
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
                      Amount in Words: USD{" "}
                      {totalPrice.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      ONLY
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

          {/* Payment & conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs mt-6">
            <div className="space-y-1">
              <p className="font-semibold">Payment must be remitted to:</p>
              <p>Beneficiary: Mohan PLC</p>
              <p className="mt-2 font-semibold">Beneficiary Bank details:</p>
              <p>BANK NAME: COMMERCIAL BANK OF ETHIOPIA</p>
              <p>SWIFT: CBETETAA</p>
              <p>Account Number: 1000679266407</p>
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
}

