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
  proforma_ref_no: string;
  add_consignee?: string | null;
  shipper: string;
  notify_party?: string | null;
  add_notify_party?: string | null;
  country_of_origin: string;
  final_destination: string;
  port_of_loading: string;
  port_of_discharge: string;
  measurement_type: string;
  payment_terms: string;
  mode_of_transport: string;
  freight: string;
  freight_price?: number | null;
  shipment_type: string;
  status: string;
  approved_by?: string | null;
  items: OrderItem[];
}

interface ShippingInvoiceSummary {
  id: string;
  invoice_number: string;
  order_number: string;
  invoice_date: string;
}

const SHIPPING_INVOICES_API_URL = "/api/inventory/shipping-invoices";

export default function OrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const orderNumber = params.orderNumber;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [shippingInvoices, setShippingInvoices] = useState<
    ShippingInvoiceSummary[]
  >([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data: unknown = await res.json();

        if (!res.ok) {
          showToast({
            title: "Failed to load order",
            description:
              (data as { detail?: string; message?: string })?.detail ||
              (data as { detail?: string; message?: string })?.message ||
              "Please try again.",
            variant: "error",
          });
          return;
        }

        const detail = data as OrderDetail;
        setOrder(detail);

        // Load existing shipping invoices for this order
        try {
          const invRes = await fetch(
            `${SHIPPING_INVOICES_API_URL}?order_number=${encodeURIComponent(
              detail.order_number
            )}`
          );
          if (invRes.ok) {
            const invData = await invRes.json();
            setShippingInvoices(invData as ShippingInvoiceSummary[]);
          }
        } catch {
          // ignore invoice load error
        }
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
    <div className="max-w-6xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/diredawa/orders/display")}
        >
          Back to Sales
        </Button>
        <h1 className="text-2xl font-bold flex-1 text-center">
          Order Detail
        </h1>
        <div className="w-[120px]" />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading order...
        </p>
      ) : !order ? (
        <p className="text-center text-sm text-muted-foreground">
          Order not found.
        </p>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left">Order Number</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Total Price</th>
                  <th className="px-4 py-2 text-left">Vendor Name</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 font-medium">
                    {order.order_number}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(order.order_date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2">
                    {totalPrice.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-2">{order.buyer}</td>
                  <td className="px-4 py-2 capitalize">{order.status}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-[240px,1fr] gap-6">
            <div className="space-y-3">
              <Button
                className="w-full justify-start"
                onClick={() =>
                  router.push(
                    `/diredawa/orders/${order.order_number}/proforma`
                  )
                }
              >
                Proforma Invoice
              </Button>
              <Button
                className="w-full justify-start"
                disabled={!selectedInvoiceId}
                onClick={() =>
                  router.push(
                    selectedInvoiceId
                      ? `/diredawa/orders/${order.order_number}/commercial?invoiceId=${selectedInvoiceId}`
                      : `/diredawa/orders/${order.order_number}/commercial`
                  )
                }
              >
                Commercial Invoice
              </Button>
              <Button
                className="w-full justify-start"
                disabled={!selectedInvoiceId}
                onClick={() =>
                  router.push(
                    selectedInvoiceId
                      ? `/diredawa/orders/${order.order_number}/bill-of-lading?invoiceId=${selectedInvoiceId}`
                      : `/diredawa/orders/${order.order_number}/bill-of-lading`
                  )
                }
              >
                Bill of Lading
              </Button>
              <Button
                className="w-full justify-start"
                disabled={!selectedInvoiceId}
                onClick={() =>
                  router.push(
                    selectedInvoiceId
                      ? `/diredawa/orders/${order.order_number}/truck-waybill?invoiceId=${selectedInvoiceId}`
                      : `/diredawa/orders/${order.order_number}/truck-waybill`
                  )
                }
              >
                Truck Waybill
              </Button>
              <Button
                className="w-full justify-start"
                disabled={!selectedInvoiceId}
                onClick={() =>
                  router.push(
                    selectedInvoiceId
                      ? `/diredawa/orders/${order.order_number}/packing-list?invoiceId=${selectedInvoiceId}`
                      : `/diredawa/orders/${order.order_number}/packing-list`
                  )
                }
              >
                Packing List
              </Button>
              <Button
                className="w-full justify-start"
                disabled={!selectedInvoiceId}
                onClick={() =>
                  router.push(
                    selectedInvoiceId
                      ? `/diredawa/orders/${order.order_number}/certificate-of-origin?invoiceId=${selectedInvoiceId}`
                      : `/diredawa/orders/${order.order_number}/certificate-of-origin`
                  )
                }
              >
                Certificate of Origin
              </Button>
              {/* <Button
                className="w-full justify-start"
                disabled={!selectedInvoiceId}
              >
                Certificate of Analysis
              </Button> */}
              <Button
                className="w-full justify-start"
                onClick={() =>
                  router.push(
                    `/diredawa/orders/${order.order_number}/shipping-details`
                  )
                }
              >
                Add Shipping Details
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() =>
                  router.push(`/diredawa/orders/${order.order_number}/edit`)
                }
              >
                Edit Order
              </Button>
            </div>

            <div className="border rounded-md overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-4 py-2 text-left">Select</th>
                    <th className="px-4 py-2 text-left">Invoice Number</th>
                    <th className="px-4 py-2 text-left">Order Number</th>
                    <th className="px-4 py-2 text-left">Invoice Date</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shippingInvoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-4 text-sm text-muted-foreground text-center"
                      >
                        No invoices added yet.
                      </td>
                    </tr>
                  ) : (
                    shippingInvoices.map((inv) => (
                      <tr key={inv.id} className="border-t">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedInvoiceId === inv.id}
                            onChange={(e) =>
                              setSelectedInvoiceId(
                                e.target.checked ? inv.id : null
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-2">{inv.invoice_number}</td>
                        <td className="px-4 py-2">{inv.order_number}</td>
                        <td className="px-4 py-2">
                          {new Date(inv.invoice_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() =>
                              router.push(
                                `/diredawa/orders/${order.order_number}/shipping-invoice/${inv.id}/edit`
                              )
                            }
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

