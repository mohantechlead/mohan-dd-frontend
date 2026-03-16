"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
        // Load order
        const orderRes = await fetch(`/api/orders/${orderNumber}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const orderData: unknown = await orderRes.json();
        if (!orderRes.ok) {
          showToast({
            title: "Failed to load order",
            description:
              (orderData as { detail?: string; message?: string })?.detail ||
              (orderData as { detail?: string; message?: string })?.message ||
              "Please try again.",
            variant: "error",
          });
          return;
        }
        const detail = orderData as OrderDetail;
        setOrder(detail);

        // Load shipping invoice: if specific invoiceId is provided, use that,
        // otherwise fall back to the first invoice for this order.
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
      }));
    }
    return [];
  }, [invoice, order]);

  const totalAmount = useMemo(
    () => itemsForTable.reduce((sum, item) => sum + item.total_price, 0),
    [itemsForTable]
  );

  // Totals for footer line: weight (KG) and bags
  const { totalNetKg, totalBags } = useMemo(() => {
    let kg = 0;
    let bags = 0;
    for (const item of itemsForTable) {
      if (item.net_weight != null) {
        kg += item.net_weight;
      } else if (item.quantity != null) {
        kg += item.quantity;
      }
      if (item.bags != null) {
        bags += item.bags;
      }
    }
    return { totalNetKg: kg, totalBags: bags };
  }, [itemsForTable]);

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
            <Image
              src="/logo.png"
              alt="Mohan PLC logo"
              width={80}
              height={80}
              className="mx-auto mb-3"
            />
            <h1 className="text-2xl font-semibold tracking-wide">Mohan PLC</h1>
            <p className="text-xs text-muted-foreground">
              Dire Dawa Free Trade Zone Branch
            </p>
            <p className="text-xs text-muted-foreground">
              Email: harsh@mohanint.com 
            </p>
            <p className="text-xs text-muted-foreground">
              &nbsp; TEL:+251-11-6621849
            </p>  
          </div>

          <h2 className="text-xl font-semibold text-center tracking-wide">
            Commercial Invoice
          </h2>

          {/* Two rows, three columns layout */}

          {/* Row 1: Shipper / Invoice info / Waybill & Customer Order */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs mt-4">
            {/* R1C1: Shipper */}
            <div className="space-y-1">
              <p className="font-semibold">Shipper</p>
              <p>Mohan PLC, Dire Dawa Free Trade Zone</p>
              <p>Dire Dawa Free Trade Zone</p>
            </div>

            {/* R1C2: Invoice Date, Invoice No, Proforma No */}
            <div className="space-y-1">
              <div>
                <p className="font-semibold">Invoice Date:</p>
                <p>
                  {new Date(invoice.invoice_date).toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
              <div>
                <p className="font-semibold">Invoice No.</p>
                <p>{invoice.invoice_number}</p>
              </div>
              <div>
                <p className="font-semibold">Proforma No.</p>
                <p>{order.proforma_ref_no}</p>
              </div>
            </div>

            {/* R1C3: Waybill Number, Customer Order No., Freight, Shipment Type */}
            <div className="space-y-1">
              <div>
                <p className="font-semibold">Waybill Number</p>
                <p>{invoice.waybill_number ?? "-"}</p>
              </div>
              <div>
                <p className="font-semibold">Customer Order No.</p>
                <p>{invoice.customer_order_number}</p>
              </div>
              <div>
                <p className="font-semibold">Freight</p>
                <p>{order.freight}</p>
              </div>
              <div>
                <p className="font-semibold">Shipment Type</p>
                <p>{order.shipment_type}</p>
              </div>
            </div>
          </div>

          <hr className="border-t my-4" />

          {/* Row 2: Buyer / Ports+Means+Payment / Country+Destination+Shipment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            {/* R2C1: Buyer Details */}
            <div className="space-y-1">
              <p className="font-semibold">Buyer Details</p>
              <p className="uppercase">{order.buyer}</p>
              {order.buyer_address && <p>{order.buyer_address}</p>}
              {order.add_consignee && <p>{order.add_consignee}</p>}
            </div>

            {/* R2C2: Port of Loading, Port Of Discharge, Means, Payment Terms */}
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
              <div>
                <p className="font-semibold">Payment Terms</p>
                <p>{order.payment_terms}</p>
              </div>
              <div>
                <p className="font-semibold">Shipment Terms</p>
                <p>{order.shipment_type}</p>
              </div>
            </div>

            {/* R2C3: Country of Origin, Final Destination, Shipper Address */}
            <div className="space-y-1">
              {order.shipper_address && (
                <div>
                  <p className="font-semibold">Shipper Address</p>
                  <p>{order.shipper_address}</p>
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
                      Amount in Words: USD {amountInWords(totalAmount)} ONLY
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

            {/* Footer note line (dynamic weights / bags) */}
            <div className="mt-4 text-[10px] text-muted-foreground">
              {totalNetKg.toLocaleString(undefined, {
                maximumFractionDigits: 3,
              })}{" "}
              KG{" "}
              {totalBags > 0
                ? `(${totalBags.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })} BAGS) `
                : ""}{" "}
              AS PER PROFORMA INV NO {order.proforma_ref_no} DATED{" "}
              {new Date(order.order_date).toLocaleDateString(undefined, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}{" "}
              PO NO {invoice.customer_order_number} TIN NO 0000050941 HIBRET
              BANK ADDIS ABABA, ETHIOPIA
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

