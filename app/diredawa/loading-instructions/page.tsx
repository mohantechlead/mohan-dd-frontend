"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { TableSearch } from "@/components/table-search";

interface ShippingInvoiceSummary {
  id: string;
  invoice_number: string;
  order_number: string;
  invoice_date: string;
  authorized_by?: string | null;
  authorized_at?: string | null;
}

const SHIPPING_INVOICES_API_URL = "/api/inventory/shipping-invoices";

export default function LoadingInstructionsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<ShippingInvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

        const list = ((data as ShippingInvoiceSummary[]) || []).sort((a, b) => {
          const aPending = !a.authorized_by || a.authorized_by.trim() === "";
          const bPending = !b.authorized_by || b.authorized_by.trim() === "";
          if (aPending !== bPending) return aPending ? -1 : 1;
          return new Date(b.invoice_date || 0).getTime() - new Date(a.invoice_date || 0).getTime();
        });
        setInvoices(list);
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

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => {
      const status =
        inv.authorized_by && inv.authorized_by.trim() !== ""
          ? "authorized"
          : "pending";
      return (
        inv.order_number.toLowerCase().includes(q) ||
        inv.invoice_number.toLowerCase().includes(q) ||
        status.includes(q) ||
        (inv.authorized_by || "").toLowerCase().includes(q)
      );
    });
  }, [invoices, search]);

  return (
    <div className="max-w-6xl mx-auto mt-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Loading Instructions</h1>

      <div className="flex justify-end">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search order, invoice, status, user..."
        />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">Loading...</p>
      ) : filteredInvoices.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No loading instructions found.
        </p>
      ) : (
        <div className="border border-border rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-left px-4 py-2 border border-border">Order Number</th>
                <th className="text-left px-4 py-2 border border-border">Invoice Number</th>
                <th className="text-left px-4 py-2 border border-border">Invoice Date</th>
                <th className="text-left px-4 py-2 border border-border">Status</th>
                <th className="text-left px-4 py-2 border border-border">Authorized By</th>
                <th className="text-right px-4 py-2 border border-border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const isAuthorized =
                  inv.authorized_by != null && inv.authorized_by.trim() !== "";
                return (
                  <tr key={inv.id} className="border-t border-border">
                    <td className="px-4 py-2 border border-border">{inv.order_number}</td>
                    <td className="px-4 py-2 border border-border">{inv.invoice_number}</td>
                    <td className="px-4 py-2 border border-border">
                      {inv.invoice_date
                        ? new Date(inv.invoice_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 border border-border capitalize">
                      {isAuthorized ? "authorized" : "pending"}
                    </td>
                    <td className="px-4 py-2 border border-border">
                      {inv.authorized_by ?? "—"}
                    </td>
                    <td className="px-4 py-2 border border-border text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/diredawa/orders/${inv.order_number}/loading-instruction?invoiceId=${inv.id}&from=loading-instructions`
                          )
                        }
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

