"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import { WSP_API_URL, money, formatDate, type WarehouseStoragePayment } from "@/lib/warehouse";

function StatusBadge({ status }: { status: string }) {
  const s = String(status ?? "").toLowerCase();
  const cls =
    s === "completed"
      ? "bg-green-100 text-green-800"
      : s === "approved"
        ? "bg-blue-100 text-blue-800"
        : s === "cancelled"
          ? "bg-red-100 text-red-800"
          : "bg-yellow-100 text-yellow-800";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {s}
    </span>
  );
}

export default function WarehousePaymentsDisplayPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [payments, setPayments] = useState<WarehouseStoragePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch(WSP_API_URL, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to load payments", description: formatApiErrorMessage(data), variant: "error" });
        return;
      }
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      showToast({ title: "Failed to load payments", description: "Something went wrong.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/diredawa/accounting")}>
          Back to Accounting
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold">Warehouse Storage Payments</h1>
        </div>
        <Button onClick={() => router.push("/diredawa/accounting/warehouse-payments/create")}>
          + New Payment
        </Button>
      </div>

      {loading ? (
        <div className="p-10 text-center">Loading...</div>
      ) : payments.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground">No payments found.</div>
      ) : (
        <div className="border rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/60">
                <th className="px-4 py-2 text-left">Payment No</th>
                <th className="px-4 py-2 text-left">WSN No</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2 font-mono text-xs">{p.payment_number}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p.wsn_no}</td>
                  <td className="px-4 py-2">{p.customer_name}</td>
                  <td className="px-4 py-2">{formatDate(p.payment_date)}</td>
                  <td className="px-4 py-2 text-right">{money(p.amount)}</td>
                  <td className="px-4 py-2 capitalize">{p.payment_type}</td>
                  <td className="px-4 py-2"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-2 text-right">{money(p.remaining_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
