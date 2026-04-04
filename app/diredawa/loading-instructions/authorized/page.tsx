"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface ShippingInvoiceSummary {
  id: string;
  invoice_number: string;
  order_number: string;
  invoice_date: string;
  authorized_by?: string | null;
  authorized_at?: string | null;
}

const SHIPPING_INVOICES_API_URL = "/api/inventory/shipping-invoices";

export default function AuthorizedLoadingInstructionsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<ShippingInvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(SHIPPING_INVOICES_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          showToast({
            title: "Failed to load loading instructions",
            description:
              (data as { detail?: string })?.detail || "Please try again.",
            variant: "error",
          });
          return;
        }
        const all = (data as ShippingInvoiceSummary[]) || [];
        const authorized = all.filter(
          (inv) => inv.authorized_by != null && inv.authorized_by.trim() !== ""
        );
        setInvoices(authorized);
      } catch {
        showToast({
          title: "Failed to load loading instructions",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">
        Authorized Loading Instructions
      </h1>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading...
        </p>
      ) : invoices.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No authorized loading instructions found.
        </p>
      ) : (
        <div className="border border-border rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-left px-4 py-2 border border-border">
                  Order Number
                </th>
                <th className="text-left px-4 py-2 border border-border">
                  Invoice Number
                </th>
                <th className="text-left px-4 py-2 border border-border">
                  Invoice Date
                </th>
                <th className="text-left px-4 py-2 border border-border">
                  Authorized By
                </th>
                <th className="text-left px-4 py-2 border border-border">
                  Authorized At
                </th>
                <th className="text-right px-4 py-2 border border-border">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-border">
                  <td className="px-4 py-2 border border-border">
                    {inv.order_number}
                  </td>
                  <td className="px-4 py-2 border border-border">
                    {inv.invoice_number}
                  </td>
                  <td className="px-4 py-2 border border-border">
                    {inv.invoice_date
                      ? new Date(inv.invoice_date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2 border border-border">
                    {inv.authorized_by ?? "—"}
                  </td>
                  <td className="px-4 py-2 border border-border">
                    {inv.authorized_at
                      ? new Date(inv.authorized_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2 border border-border text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/diredawa/orders/${inv.order_number}/loading-instruction?invoiceId=${inv.id}&from=authorized-loading-instructions`
                        )
                      }
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
