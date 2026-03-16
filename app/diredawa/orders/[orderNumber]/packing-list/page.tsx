"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";

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

interface ShippingInvoiceSummary {
  id: string;
  order_number: string;
  invoice_number: string;
  invoice_date: string;
  waybill_number?: string | null;
  customer_order_number: string;
}

interface ShippingInvoiceDetail {
  id: string;
  order_number: string;
  invoice_number: string;
  invoice_date: string;
  waybill_number?: string | null;
  customer_order_number: string;
  items: {
    item_name: string;
    price: number;
    quantity: number;
    total_price: number;
    measurement: string;
    bags?: number | null;
    net_weight?: number | null;
    gross_weight?: number | null;
  }[];
}

const SHIPPING_INVOICES_API_URL = "/api/inventory/shipping-invoices";

export default function PackingListPage() {
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
          const listData = (await listRes.json()) as ShippingInvoiceSummary[];
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
          title: "Failed to load Packing List",
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

  const { totalBags, totalNetKg } = useMemo(() => {
    let bags = 0;
    let net = 0;
    for (const item of itemsForTable) {
      if (item.bags != null) {
        bags += item.bags;
      }
      if (item.net_weight != null) {
        net += item.net_weight;
      } else if (item.quantity != null) {
        net += item.quantity;
      }
    }
    return { totalBags: bags, totalNetKg: net };
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
          Loading Packing List...
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
              TEL:+251-11-6621849
            </p>
          </div>

          <h2 className="text-lg font-semibold text-center tracking-wide">
            Packing List
          </h2>

          <hr className="border-t" />

          {/* Info rows similar to screenshot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            {/* Shipper */}
            <div className="space-y-1">
              <p className="font-semibold">Shipper</p>
              <p className="uppercase">{order.shipper}</p>
              {order.shipper_address && (
                <p className="text-[11px] text-muted-foreground">
                  {order.shipper_address}
                </p>
              )}
              {order.add_consignee && (
                <p className="text-[11px] text-muted-foreground">
                  {order.add_consignee}
                </p>
              )}
            </div>

            {/* Invoice details */}
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

            {/* Customer order, truck waybill, Freight, Shipment Type */}
            <div className="space-y-1">
              <div>
                <p className="font-semibold">Customer Order No.</p>
                <p>{invoice.customer_order_number}</p>
              </div>
              <div>
                <p className="font-semibold">Truck Waybill Number</p>
                <p>{invoice.waybill_number ?? "-"}</p>
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

          <hr className="border-t" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            {/* Buyer details */}
            <div className="space-y-1">
              <p className="font-semibold">Buyer Details</p>
              <p className="uppercase">{order.buyer}</p>
              {order.buyer_address && (
                <p className="text-[11px] text-muted-foreground">
                  {order.buyer_address}
                </p>
              )}
              {order.add_notify_party && (
                <p className="text-[11px] text-muted-foreground">
                  {order.add_notify_party}
                </p>
              )}
            </div>

            {/* Ports and means */}
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

            {/* Country / destination / Shipment Terms */}
            <div className="space-y-1">
              <div>
                <p className="font-semibold">Country of Origin</p>
                <p>{order.country_of_origin}</p>
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

          <hr className="border-t" />

          {/* Particulars table */}
          <div className="mt-6">
            <div className="border-t border-b py-2 text-center text-xs font-semibold tracking-wide">
              PARTICULARS FURNISHED BY SHIPPER
            </div>
            <table className="w-full text-xs border-b">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left w-32">No. of Packages</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-left w-20">Unit</th>
                  <th className="px-3 py-2 text-right w-32">Gross Weight</th>
                  <th className="px-3 py-2 text-left w-24">Origin</th>
                </tr>
              </thead>
              <tbody>
                {itemsForTable.map((item, index) => {
                  const orderItem =
                    order.items.find((o) => o.item_name === item.item_name) ??
                    null;
                  const packagesLabel =
                    item.bags != null
                      ? `${item.bags.toLocaleString()} packages`
                      : "-";
                  const grossLabel =
                    item.gross_weight != null
                      ? item.gross_weight.toLocaleString(undefined, {
                          maximumFractionDigits: 3,
                        })
                      : "";
                  const unitLabel =
                    orderItem?.measurement || item.measurement || "KG";

                  return (
                    <tr
                      key={index}
                      className="border-b last:border-b-0 align-top"
                    >
                      <td className="px-3 py-2">{packagesLabel}</td>
                      <td className="px-3 py-2">
                        <div>
                          {item.quantity.toLocaleString(undefined, {
                            maximumFractionDigits: 3,
                          })}{" "}
                          {unitLabel} {item.item_name}
                        </div>
                        {orderItem?.hs_code ? (
                          <div className="text-[10px] text-muted-foreground">
                            HS-code:{orderItem.hs_code}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">{unitLabel}</td>
                      <td className="px-3 py-2 text-right">
                        {grossLabel && `${grossLabel} KG`}
                      </td>
                      <td className="px-3 py-2">{order.country_of_origin}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-4 text-xs text-muted-foreground">
              {totalBags > 0 && (
                <div>
                  Total No of Packages{" "}
                  {totalBags.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}{" "}
                  packages
                </div>
              )}
              {totalNetKg > 0 && (
                <div className="mt-1">
                  {totalNetKg.toLocaleString(undefined, {
                    maximumFractionDigits: 3,
                  })}{" "}
                  KG{" "}
                  {totalBags > 0
                    ? `(${totalBags.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })} BAGS) `
                    : ""}
                  AS PER PROFORMA INV NO {order.proforma_ref_no} DATED{" "}
                  {new Date(order.order_date).toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  PO NO {invoice.customer_order_number} TIN NO 0000050941
                  HIBRET BANK ADDIS ABABA, ETHIOPIA
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

