"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
  buyer_tin_number?: string | null;
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
  bank?: string | null;
  items: ShippingInvoiceItem[];
}

const SHIPPING_INVOICES_API_URL = "/api/inventory/shipping-invoices";

export default function CertificateOfOriginPage() {
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

        const invRes = await fetch(
          `${SHIPPING_INVOICES_API_URL}/${invoiceId}`
        );
        if (!invRes.ok) {
          setInvoice(null);
          return;
        }
        const invData = (await invRes.json()) as ShippingInvoiceDetail;
        setInvoice(invData);
      } catch {
        showToast({
          title: "Failed to load Certificate of Origin",
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

  return (
    <div
      className="max-w-6xl mx-auto py-8 space-y-8 bg-white font-poppins"
      data-print-doc="large"
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
          Loading Certificate of Origin...
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
        <div className="space-y-6">
          {/* Logo and header */}
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

          <h2 className="text-xl font-semibold text-center tracking-wide">
            Certificate of Origin
          </h2>

          <div className="text-xs text-center max-w-3xl mx-auto mt-2 text-muted-foreground">
            This is to certify according to bills of lading and other documents
            produced that the following goods is:
          </div>

          {/* Seller / Buyer / Descriptions / Weight */}
          <div className="mt-4">
            <table className="w-full text-xs border border-collapse uppercase">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left w-[22%] align-top border-r border-border">
                    Seller
                  </th>
                  <th className="px-3 py-2 text-left w-[22%] align-top border-r border-border">
                    Buyer
                  </th>
                  <th className="px-3 py-2 text-left w-[36%] align-top border-r border-border">
                    Descriptions
                  </th>
                  <th className="px-3 py-2 text-left w-[20%] align-top">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {itemsForTable.length > 0 ? (
                  itemsForTable.map((item, idx) => {
                    const netKg =
                      item.net_weight != null
                        ? item.net_weight
                        : item.quantity != null
                          ? item.quantity
                          : 0;
                    const grossKg =
                      item.gross_weight != null
                        ? item.gross_weight
                        : item.quantity != null
                          ? item.quantity
                          : 0;
                    const orderLine = order.items.find(
                      (o) => o.item_name === item.item_name
                    );
                    const hsCode = orderLine?.hs_code ?? "";
                    const unit = (
                      orderLine?.measurement ||
                      item.measurement ||
                      "KG"
                    )
                      .trim()
                      .toUpperCase() || "KG";
                    const bagsSuffix =
                      item.bags != null && item.bags > 0
                        ? ` (${item.bags.toLocaleString()} ${
                            item.bags === 1 ? "Bag" : "Bags"
                          })`
                        : "";
                    const rowSpan = itemsForTable.length;
                    return (
                      <tr key={idx} className="align-top">
                        {idx === 0 ? (
                          <td
                            className="px-3 py-3 border-r border-border align-top"
                            rowSpan={rowSpan}
                          >
                            <div className="font-semibold uppercase">
                              {order.shipper}
                            </div>
                            {order.shipper_address ? (
                              <div className="text-[11px] text-muted-foreground mt-1 whitespace-pre-wrap">
                                {order.shipper_address}
                              </div>
                            ) : null}
                            <div className="text-[11px] text-muted-foreground mt-1">
                              Mohan PLC, Dire Dawa Free Trade Zone Branch
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Dire Dawa Free Trade Zone
                            </div>
                          </td>
                        ) : null}
                        {idx === 0 ? (
                          <td
                            className="px-3 py-3 border-r border-border align-top"
                            rowSpan={rowSpan}
                          >
                            <div className="font-semibold uppercase">
                              {order.buyer}
                            </div>
                            {order.buyer_address ? (
                              <div className="text-[11px] text-muted-foreground mt-1 whitespace-pre-wrap">
                                {order.buyer_address}
                              </div>
                            ) : null}
                            {order.add_consignee?.trim() ? (
                              <div className="text-[11px] text-muted-foreground mt-1 whitespace-pre-wrap">
                                {order.add_consignee}
                              </div>
                            ) : null}
                            {order.notify_party?.trim() ? (
                              <div className="mt-2">
                                <span className="font-semibold text-[11px]">
                                  Notify:{" "}
                                </span>
                                <span className="text-[11px] whitespace-pre-wrap">
                                  {order.notify_party}
                                </span>
                              </div>
                            ) : null}
                            {order.add_notify_party?.trim() ? (
                              <div className="text-[11px] text-muted-foreground mt-1 whitespace-pre-wrap">
                                {order.add_notify_party}
                              </div>
                            ) : null}
                          </td>
                        ) : null}
                        <td className="px-3 py-3 border-r border-border align-top">
                          <div className="font-medium">
                            {netKg.toLocaleString(undefined, {
                              maximumFractionDigits: 3,
                            })}{" "}
                            {unit}
                            {bagsSuffix} {item.item_name}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1">
                            Country of origin:{" "}
                            {item.country_of_origin?.trim() ||
                              order.country_of_origin ||
                              "—"}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1">
                            AS PER PROFORMA INV NO {order.proforma_ref_no} DATED{" "}
                            {new Date(order.order_date).toLocaleDateString(
                              undefined,
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </div>
                          {idx === 0 ? (
                            <div className="mt-2 space-y-1 text-[11px]">
                              <div>
                                HS Code: {hsCode?.trim() || "-"}
                              </div>
                              <div>
                                TIN No: {order.buyer_tin_number?.trim() || "-"}
                              </div>
                              <div>
                                PO Number: {invoice.customer_order_number}
                              </div>
                              {invoice.bank?.trim() ? (
                                <div className="whitespace-pre-wrap">
                                  {invoice.bank.trim()}
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            hsCode && (
                              <div className="mt-1 text-[11px]">
                                HS CODE: {hsCode}
                              </div>
                            )
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div>
                            NW{" "}
                            {netKg.toLocaleString(undefined, {
                              maximumFractionDigits: 3,
                            })}{" "}
                            {unit}
                          </div>
                          <div>
                            GW{" "}
                            {grossKg.toLocaleString(undefined, {
                              maximumFractionDigits: 3,
                            })}{" "}
                            {unit}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-3">
                      No items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer line with loaded by / destination / product of */}
          <div className="text-xs mt-8">
            <div className="flex justify-between gap-8">
              <div className="space-y-2">
                <div>
                  Loaded by ______{" "}
                  <span className="font-semibold">MOHAN PLC</span>
                </div>
                <div>
                  Are really PRODUCT OF{" "}
                  <span className="font-semibold">
                    {itemsForTable.length > 0
                      ? [
                          ...new Set(
                            itemsForTable
                              .map((i) => i.country_of_origin || "CHINA")
                              .filter(Boolean)
                          ),
                        ].join(" | ")
                      : order.country_of_origin || "CHINA"}
                  </span>
                </div>
              </div>
              <div className="text-left space-y-1 min-w-[200px]">
                <div>
                  <span className="font-semibold">Destination</span>{" "}
                  <span>
                    {order.final_destination?.trim() ||
                      order.port_of_discharge?.trim() ||
                      "—"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Date</span>{" "}
                  {new Date(invoice.invoice_date).toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

