"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/authProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  authorized_by?: string | null;
  authorized_at?: string | null;
  bank?: string | null;
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

const KG_EQUIVALENTS: Record<string, number> = {
  kg: 1,
  kgs: 1,
  kilogram: 1,
  kilograms: 1,
  mt: 1000,
  ton: 1000,
  tons: 1000,
  tonne: 1000,
  tonnes: 1000,
  g: 0.001,
  gram: 0.001,
  grams: 0.001,
  lb: 0.45359237,
  lbs: 0.45359237,
  pound: 0.45359237,
  pounds: 0.45359237,
};

export default function LoadingInstructionPage() {
  const params = useParams<{ orderNumber: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const auth = useAuth();

  const orderNumber = params.orderNumber;
  const invoiceIdFromQuery = searchParams.get("invoiceId");
  const fromList = searchParams.get("from") === "loading-instructions";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [invoice, setInvoice] = useState<ShippingInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthorizeDialog, setShowAuthorizeDialog] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

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

  const handleAuthorizeConfirm = async () => {
    if (!invoice?.id) return;
    setAuthorizing(true);
    try {
      const res = await fetch(
        `/api/inventory/shipping-invoices/${invoice.id}/authorize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const data: unknown = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to authorize",
          description:
            (data as { detail?: string; message?: string })?.detail ||
            (data as { detail?: string; message?: string })?.message ||
            "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({
        title: "Authorized",
        description: "Loading instruction has been authorized and saved.",
        variant: "success",
      });
      setShowAuthorizeDialog(false);
      setInvoice((prev) =>
        prev && data ? { ...prev, ...(data as Partial<ShippingInvoiceDetail>) } : prev
      );
    } catch {
      showToast({
        title: "Failed to authorize",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setAuthorizing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 bg-white font-poppins">
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          onClick={() =>
            router.push(
              fromList
                ? "/diredawa/loading-instructions"
                : auth?.isStore
                ? "/diredawa/loading-instructions/authorized"
                : `/diredawa/orders/${orderNumber}`
            )
          }
        >
          {fromList
            ? "Back to Loading Instructions"
            : auth?.isStore
              ? "Back to Auth. Loading Instruction"
              : "Back to Order Detail"}
        </Button>
        <div className="flex items-center gap-2">
          {invoice?.authorized_by ? (
            <span className="inline-flex items-center rounded-md bg-muted px-3 py-1.5 text-sm font-medium">
              Authorized
            </span>
          ) : !auth?.isStore ? (
            <Button
              variant="outline"
              onClick={() => setShowAuthorizeDialog(true)}
              disabled={!invoice}
            >
              Authorize
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      <Dialog open={showAuthorizeDialog} onOpenChange={setShowAuthorizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authorize Loading Instruction</DialogTitle>
            <DialogDescription>
              Are you sure you want to authorize this loading instruction? This
              will save the authorization.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAuthorizeDialog(false)}
              disabled={authorizing}
            >
              No
            </Button>
            <Button onClick={handleAuthorizeConfirm} disabled={authorizing}>
              {authorizing ? "Saving..." : "Yes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {invoice.bank?.trim() ? (
                <p>
                  <span className="font-semibold">Bank: </span>
                  <span className="whitespace-pre-wrap">{invoice.bank}</span>
                </p>
              ) : null}
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

                  const toKg = (value: number, unit?: string | null) => {
                    const factor = KG_EQUIVALENTS[(unit || "").trim().toLowerCase()];
                    return factor != null ? value * factor : value;
                  };

                  const remarks = (() => {
                    if (item.net_weight != null) {
                      const netInKg = toKg(item.net_weight, item.measurement);
                      return `${netInKg.toLocaleString(undefined, {
                        maximumFractionDigits: 3,
                      })} KG`;
                    }
                    if (item.gross_weight != null) {
                      const grossInKg = toKg(item.gross_weight, item.measurement);
                      return `${grossInKg.toLocaleString(undefined, {
                        maximumFractionDigits: 3,
                      })} KG`;
                    }
                    if (item.quantity != null) {
                      const qtyInKg = toKg(item.quantity, item.measurement);
                      return `${qtyInKg.toLocaleString(undefined, {
                        maximumFractionDigits: 3,
                      })} KG`;
                    }
                    return "—";
                  })();

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
