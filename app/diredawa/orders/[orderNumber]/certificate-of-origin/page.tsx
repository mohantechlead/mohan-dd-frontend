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
}

interface ShippingInvoiceDetail {
  id: string;
  order_number: string;
  invoice_number: string;
  invoice_date: string;
  waybill_number?: string | null;
  customer_order_number: string;
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
      }));
    }
    return [];
  }, [invoice, order]);

  const mainOrderItem = useMemo(() => {
    if (!order || itemsForTable.length === 0) return null;
    const first = itemsForTable[0];
    const byName =
      order.items.find((o) => o.item_name === first.item_name) || null;
    return byName || order.items[0] || null;
  }, [order, itemsForTable]);

  const { totalNetKg, totalGrossKg } = useMemo(() => {
    let net = 0;
    let gross = 0;
    for (const item of itemsForTable) {
      if (item.net_weight != null) {
        net += item.net_weight;
      } else if (item.quantity != null) {
        net += item.quantity;
      }
      if (item.gross_weight != null) {
        gross += item.gross_weight;
      } else if (item.quantity != null) {
        gross += item.quantity;
      }
    }
    return { totalNetKg: net, totalGrossKg: gross };
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

          <h2 className="text-xl font-semibold text-center tracking-wide">
            Certificate of Origin
          </h2>

          <div className="text-xs text-center max-w-3xl mx-auto mt-2 text-muted-foreground">
            This is to certify according to bills of lading and other documents
            produced that the following goods is:
          </div>

          {/* Brands / Description / Weight table */}
          <div className="mt-4">
            <table className="w-full text-xs border-t border-b">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left w-1/4">Brands</th>
                  <th className="px-3 py-2 text-left w-2/4">
                    Description of Goods
                  </th>
                  <th className="px-3 py-2 text-left w-1/4">Weight</th>
                </tr>
              </thead>
              <tbody>
                <tr className="align-top">
                  <td className="px-3 py-3">
                    <div className="font-semibold uppercase">
                      {order.shipper}
                    </div>
                    {order.shipper_address && (
                      <div className="text-[11px] text-muted-foreground">
                        {order.shipper_address}
                      </div>
                    )}
                    <div className="text-[11px] text-muted-foreground">
                      DIRE DAWA FREE TRADE ZONE BRANCH
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {itemsForTable.length > 0 && (
                      <>
                        <div>
                          {totalNetKg.toLocaleString(undefined, {
                            maximumFractionDigits: 3,
                          })}{" "}
                          KG{" "}
                          {itemsForTable[0].item_name}
                        </div>
                        <div>
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
                        <div>
                          PO NUMBER: {invoice.customer_order_number}
                        </div>
                        <div>HS CODE: {mainOrderItem?.hs_code ?? ""}</div>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div>
                      NW{" "}
                      {totalNetKg.toLocaleString(undefined, {
                        maximumFractionDigits: 3,
                      })}{" "}
                      KG
                    </div>
                    <div>
                      GW{" "}
                      {totalGrossKg.toLocaleString(undefined, {
                        maximumFractionDigits: 3,
                      })}{" "}
                      KG
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer line with loaded by / destination / product of */}
          <div className="text-xs mt-8 space-y-2">
            <div className="flex justify-between">
              <div>
                Loaded by ______{" "}
                <span className="font-semibold">MOHAN PLC</span>
              </div>
              <div>
                Destination{" "}
                <span className="font-semibold">
                  {order.final_destination || "MOHAN INTERNATIONAL WAREHOUSE, ADDIS ABABA"}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                Are really PRODUCT OF{" "}
                <span className="font-semibold">
                  {order.country_of_origin || "CHINA"}
                </span>
              </div>
              <div>
                Addis Ababa,{" "}
                {new Date(order.order_date).toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

