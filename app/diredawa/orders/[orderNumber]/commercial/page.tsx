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
  shipment_type: string;
  items: OrderItem[];
}

interface ShippingInvoiceItem {
  item_name: string;
  price: number;
  quantity: number;
  total_price: number;
  measurement: string;
  bags?: number | null;
  net_weight?: number | null;
  gross_weight?: number | null;
}

interface ShippingInvoiceDetail {
  id: string;
  order_number: string;
  invoice_number: string;
  invoice_date: string;
  waybill_number?: string | null;
  customer_order_number: string;
  container_number?: string | null;
  vessel?: string | null;
  invoice_remark?: string | null;
  packing_list_remark?: string | null;
  waybill_remark?: string | null;
  bill_of_lading_remark?: string | null;
  items: ShippingInvoiceItem[];
}

const SHIPPING_INVOICES_API_URL = "/api/inventory/shipping-invoices";

export default function CommercialInvoicePage() {
  const params = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const orderNumber = params.orderNumber;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [invoice, setInvoice] = useState<ShippingInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load order
        const orderRes = await fetch(`/api/orders/${orderNumber}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          showToast({
            title: "Failed to load order",
            description:
              (orderData as any)?.detail ||
              (orderData as any)?.message ||
              "Please try again.",
            variant: "error",
          });
          return;
        }
        const detail = orderData as OrderDetail;
        setOrder(detail);

        // Load shipping invoices for this order
        const listRes = await fetch(
          `${SHIPPING_INVOICES_API_URL}?order_number=${encodeURIComponent(
            detail.order_number
          )}`
        );
        if (!listRes.ok) {
          setInvoice(null);
          return;
        }
        const listData = (await listRes.json()) as {
          id: string;
          invoice_number: string;
          order_number: string;
          invoice_date: string;
        }[];
        if (!listData || listData.length === 0) {
          setInvoice(null);
          return;
        }
        // Use the latest invoice (by date or just first)
        const selected = listData[0];

        const detailRes = await fetch(
          `${SHIPPING_INVOICES_API_URL}/${selected.id}`
        );
        if (!detailRes.ok) {
          setInvoice(null);
          return;
        }
        const detailData = (await detailRes.json()) as ShippingInvoiceDetail;
        setInvoice(detailData);
      } catch {
        showToast({
          title: "Failed to load commercial invoice",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (orderNumber) {
      fetchData();
    }
  }, [orderNumber, showToast]);

  const itemsForTable = useMemo(() => {
    if (invoice && invoice.items && invoice.items.length > 0) {
      return invoice.items;
    }
    if (order) {
      return order.items.map((i) => ({
        item_name: i.item_name,
        price: i.price,
        quantity: i.quantity,
        total_price: i.total_price,
        measurement: i.measurement,
        bags: null,
        net_weight: null,
        gross_weight: null,
      }));
    }
    return [];
  }, [invoice, order]);

  const totalAmount = useMemo(
    () => itemsForTable.reduce((sum, item) => sum + item.total_price, 0),
    [itemsForTable]
  );

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
          Loading commercial invoice...
        </p>
      ) : !order ? (
        <p className="text-center text-sm text-muted-foreground">
          Order not found.
        </p>
      ) : !invoice ? (
        <p className="text-center text-sm text-muted-foreground">
          No shipping details found for this order. Please add Shipping Details
          first.
        </p>
      ) : (
        <div className="space-y-8">
          {/* Header / Company info */}
          <div className="text-center space-y-1">
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
            Commercial Invoice
          </h2>

          {/* Top header columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            <div className="space-y-1">
              <p className="font-semibold">Invoice Date:</p>
              <p>
                {new Date(invoice.invoice_date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold">Invoice No.</span>
                <span>{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Proforma No.</span>
                <span>{order.proforma_ref_no}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold">Waybill Number</span>
                <span>{invoice.waybill_number ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Customer Order No.</span>
                <span>{invoice.customer_order_number}</span>
              </div>
            </div>
          </div>

          <hr className="border-t" />

          {/* Shipper / Buyer / route info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            <div className="space-y-2">
              <p className="font-semibold">Shipper</p>
              <p>Mohan PLC, Dire Dawa Free Trade Zone</p>
              <p>Dire Dawa Free Trade Zone</p>

              <div className="mt-4 space-y-1">
                <p className="font-semibold">Buyer Details</p>
                <p className="uppercase">{order.buyer}</p>
                {order.add_consignee && <p>{order.add_consignee}</p>}
              </div>
            </div>

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

              <p className="font-semibold mt-3">Shipment Terms</p>
              <p>{order.shipment_type}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            <div />
            <div className="space-y-1">
              <p className="font-semibold">Payment Terms</p>
              <p>{order.payment_terms}</p>
            </div>
          </div>

          {/* Items table */}
          <div className="mt-4">
            <table className="w-full text-xs border-t">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-2 text-left w-12">Sr. No.</th>
                  <th className="px-2 py-2 text-left">
                    Description of Commodities
                  </th>
                  <th className="px-2 py-2 text-left">Unit</th>
                  <th className="px-2 py-2 text-right">Qty</th>
                  <th className="px-2 py-2 text-right">Price</th>
                  <th className="px-2 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {itemsForTable.map((item, index) => {
                  const orderItem =
                    order.items.find((o) => o.item_name === item.item_name) ??
                    null;
                  return (
                    <tr key={index} className="border-b align-top">
                      <td className="px-2 py-2 text-left">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td className="px-2 py-2">
                        <div>{item.item_name}</div>
                        {orderItem?.hs_code ? (
                          <div className="text-[10px] text-muted-foreground">
                            HS-code:{orderItem.hs_code}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-2 py-2">
                        {item.measurement || orderItem?.measurement || ""}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-right">
                        ${item.price.toLocaleString(undefined, {
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="px-2 py-2 text-right">
                        ${item.total_price.toLocaleString(undefined, {
                          maximumFractionDigits: 3,
                        })}
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td className="px-2 py-2 font-semibold" colSpan={5}>
                    Total
                    <span className="ml-4 text-[10px] text-muted-foreground">
                      Amount in Words: USD{" "}
                      {totalAmount.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      ONLY
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right font-semibold">
                    ${totalAmount.toLocaleString(undefined, {
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

