"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  payment_terms: string;
  mode_of_transport: string;
  freight?: string | null;
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
  country_of_origin?: string | null;
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
  bank?: string | null;
  items: ShippingInvoiceItem[];
}

const SHIPPING_INVOICES_API_URL = "/api/inventory/shipping-invoices";

export default function BillOfLadingPage() {
  const params = useParams<{ orderNumber: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const orderNumber = params.orderNumber;
  const invoiceIdFromQuery = searchParams.get("invoiceId");

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [invoice, setInvoice] = useState<ShippingInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        // Resolve which invoice to load
        let invoiceId = invoiceIdFromQuery;
        if (!invoiceId) {
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
          invoiceId = listData[0].id;
        }

        const detailRes = await fetch(
          `${SHIPPING_INVOICES_API_URL}/${invoiceId}`
        );
        if (!detailRes.ok) {
          setInvoice(null);
          return;
        }
        const detailData = (await detailRes.json()) as ShippingInvoiceDetail;
        setInvoice(detailData);
      } catch {
        showToast({
          title: "Failed to load bill of lading",
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
  }, [orderNumber, invoiceIdFromQuery, showToast]);

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
        country_of_origin: order.country_of_origin || null,
      }));
    }
    return [];
  }, [invoice, order]);

  const countriesDisplay = useMemo(() => {
    if (itemsForTable.length > 0) {
      const countries = [
        ...new Set(
          itemsForTable
            .map((i) => i.country_of_origin?.trim())
            .filter((c) => c)
        ),
      ];
      if (countries.length > 0) return countries.join(" | ");
    }
    return order?.country_of_origin || "";
  }, [itemsForTable, order]);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 bg-white font-poppins">
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
          Loading bill of lading...
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
          <h1 className="text-lg font-semibold tracking-wide text-center">
            BILL OF LADING FOR COMBINED TRANSPORT AND SHIPMENTS
          </h1>

          {/* Row 1: Shipper / Invoice / Customer Ref */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs mt-4">
            {/* R1C1: Shipper */}
            <div className="space-y-1">
              <p className="font-semibold">Shipper</p>
              <p>Mohan PLC, Dire Dawa Free Trade Zone</p>
              <p>Dire Dawa Free Trade Zone</p>
            </div>

            {/* R1C2: Invoice Date */}
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

            {/* R1C3: Customer Ref. No, Freight, Shipment Type */}
            <div className="space-y-1">
              <p className="font-semibold">Customer Ref. no</p>
              <p>{invoice.customer_order_number}</p>
              <p className="font-semibold mt-2">Freight</p>
              <p>{order.freight}</p>
              <p className="font-semibold mt-2">Shipment Type</p>
              <p>{order.shipment_type}</p>
              {invoice.bank?.trim() ? (
                <>
                  <p className="font-semibold mt-2">Bank</p>
                  <p className="whitespace-pre-wrap">{invoice.bank}</p>
                </>
              ) : null}
            </div>
          </div>

          {/* Row 2: Buyer / Ports / Country+Destination+Shipment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs mt-4">
            {/* R2C1: Buyer Details */}
            <div className="space-y-1">
              <p className="font-semibold">Buyer Details</p>
              <p className="uppercase">{order.buyer}</p>
              {order.buyer_address && <p>{order.buyer_address}</p>}
              {order.add_consignee && <p>{order.add_consignee}</p>}
            </div>

            {/* R2C2: Port of Loading, Port Of Discharge, Means of Transport */}
            <div className="space-y-1">
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

            {/* R2C3: Country / Final Destination / Shipment Terms */}
            <div className="space-y-1">
              <div>
                <p className="font-semibold">Country of Origin</p>
                <p>{countriesDisplay}</p>
              </div>
              <div>
                <p className="font-semibold">Final Destination</p>
                <p>{order.final_destination}</p>
              </div>
              <div>
                <p className="font-semibold">Shipment Terms</p>
                <p>{order.shipment_type}</p>
              </div>
            </div>
          </div>

          <hr className="border-t my-4" />

          {/* Consignee / Notify Party / Waybill + Vessel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            <div className="space-y-1">
              <p className="font-semibold">Consignee</p>
              <p className="uppercase">{order.buyer}</p>
              {order.buyer_address && <p>{order.buyer_address}</p>}
              {order.add_consignee && <p>{order.add_consignee}</p>}
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Notify Party</p>
              <p>{order.notify_party}</p>
              {order.add_notify_party && <p>{order.add_notify_party}</p>}
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Waybill Number</p>
              <p>{invoice.waybill_number ?? "-"}</p>
              <p className="font-semibold mt-2">Vessel Name</p>
              <p>{invoice.vessel ?? "-"}</p>
            </div>
          </div>

          {/* Items table */}
          <div className="mt-4">
            <table className="w-full text-xs border-t">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-2 text-left w-20">Container No.</th>
                  <th className="px-2 py-2 text-left">Description of Goods</th>
                  <th className="px-2 py-2 text-left">Measurement</th>
                  <th className="px-2 py-2 text-right">Net Wt. (Kg)</th>
                  <th className="px-2 py-2 text-right">Gross Wt. (Kg)</th>
                </tr>
              </thead>
              <tbody>
                {itemsForTable.map((item, index) => (
                  <tr key={index} className="border-t align-top">
                    <td className="px-2 py-2">
                      {invoice.container_number ?? ""}
                    </td>
                    <td className="px-2 py-2">
                      <div>{item.item_name}</div>
                      {order.items.find((o) => o.item_name === item.item_name)
                        ?.hs_code && (
                        <div className="text-[10px] text-muted-foreground">
                          HS-code:
                          {
                            order.items.find(
                              (o) => o.item_name === item.item_name
                            )?.hs_code
                          }
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2">{item.measurement}</td>
                    <td className="px-2 py-2 text-right">
                      {item.net_weight ?? ""}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {item.gross_weight ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invoice.bill_of_lading_remark?.trim() ? (
            <div className="mt-3 text-xs">
              <p className="whitespace-pre-wrap text-muted-foreground">
                {invoice.bill_of_lading_remark}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

