"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface OrderDetail {
  id: string;
  order_number: string;
  order_date: string;
  buyer: string;
  buyer_address?: string | null;
}

interface ShippingInvoiceDetail {
  id: string;
  order_number: string;
  invoice_number: string;
  invoice_date: string;
  customer_order_number: string;
  sr_no?: number;
  items: {
    item_name: string;
    price: number;
    quantity: number;
    total_price: number;
    measurement: string;
    bags?: number | null;
    net_weight?: number | null;
    gross_weight?: number | null;
    grade?: string | null;
    brand?: string | null;
  }[];
}

const SHIPPING_INVOICES_API_URL = "/api/inventory/shipping-invoices";

export default function LoadingInstructionPage() {
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
          const listData = (await listRes.json()) as { id: string }[];
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
          title: "Failed to load Loading Instruction",
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

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 bg-white font-poppins">
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          onClick={() => router.push(`/diredawa/orders/${orderNumber}`)}
        >
          Back to Order Detail
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading...
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
        <div className="space-y-6 px-8">
          {/* Title */}
          <h1 className="text-xl font-bold text-center uppercase tracking-wide">
            Loading Instruction
          </h1>

          {/* Header - two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="space-y-1">
              <p>
                <span className="font-semibold">Date: </span>

              </p>
              <p>
                <span className="font-semibold">Customer Name: </span>
                {order.buyer}
              </p>
              <p>
                <span className="font-semibold">Invoice No: </span>
                {invoice.invoice_number}
              </p>
            </div>
            <div className="space-y-1">
              <p>
                <span className="font-semibold">Sr. No.: </span>
                {invoice.sr_no != null ? Number(invoice.sr_no) : ""}
              </p>
              <p>
                <span className="font-semibold">Ecd. No: </span>
                _______________
              </p>
            </div>
          </div>

          {/* Items table */}
          <div className="mt-6">
            <table className="w-full text-sm border-collapse border border-black">
              <thead>
                <tr className="bg-muted/60">
                  <th className="border border-black px-3 py-2 text-left w-16">
                    Sr. No
                  </th>
                  <th className="border border-black px-3 py-2 text-left">
                    Description
                  </th>
                  <th className="border border-black px-3 py-2 text-left w-24">
                    Grade
                  </th>
                  <th className="border border-black px-3 py-2 text-left w-24">
                    Brand
                  </th>
                  <th className="border border-black px-3 py-2 text-left w-24">
                    Unit of Measurement
                  </th>
                  <th className="border border-black px-3 py-2 text-left w-24">
                    No of Unit
                  </th>
                  <th className="border border-black px-3 py-2 text-left w-24">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {
                  const noOfUnit =
                    item.bags != null
                      ? `${item.bags.toLocaleString()} bags`
                      : item.quantity != null
                        ? `${item.quantity} ${item.measurement || ""}`
                        : "—";
                  const remarks =
                    item.net_weight != null
                      ? `${item.net_weight.toLocaleString(undefined, {
                          maximumFractionDigits: 3,
                        })} kg`
                      : item.gross_weight != null
                        ? `${item.gross_weight.toLocaleString(undefined, {
                            maximumFractionDigits: 3,
                          })} kg`
                        : "—";

                  return (
                    <tr key={index} className="border-b border-black">
                      <td className="border border-black px-3 py-2">
                        {invoice.sr_no != null
                          ? Number(invoice.sr_no) + index
                          : ""}
                      </td>
                      <td className="border border-black px-3 py-2">
                        {item.item_name}
                      </td>
                      <td className="border border-black px-3 py-2">
                        {item.grade || "—"}
                      </td>
                      <td className="border border-black px-3 py-2">
                        {item.brand || "—"}
                      </td>
                      <td className="border border-black px-3 py-2">
                        {item.measurement || "—"}
                      </td>
                      <td className="border border-black px-3 py-2">
                        {noOfUnit}
                      </td>
                      <td className="border border-black px-3 py-2">
                        {remarks}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer - signature section */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-semibold mb-1">
                Instruction Given Name and Signature :
              </p>
              <p className="mt-4">Kapil Singhvi</p>
              <div className="mt-8 h-12 border-b border-black w-48" />
            </div>
            <div className="flex flex-col justify-end">
              <p className="font-semibold">
                Date:
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
