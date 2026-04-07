"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface ReceivedPayment { id: string; payment_number: string; payment_date: string; order_number: string; customer_name: string; amount: number; status_remark?: string | null; status: string; }
const API_URL = "/api/accounting/received-payments";

export default function RejectedReceivedPaymentsPage() {
  const router = useRouter(); const { showToast } = useToast();
  const [loading, setLoading] = useState(true); const [rows, setRows] = useState<ReceivedPayment[]>([]);
  useEffect(() => { (async () => { try { const res = await fetch(API_URL, { method: "GET", credentials: "include" }); const data = await res.json(); if (!res.ok) { showToast({ title: "Failed to load received payments", description: data?.detail || "Please try again.", variant: "error" }); return; } setRows((Array.isArray(data) ? data : []).filter((x: ReceivedPayment) => x.status === "cancelled")); } catch { showToast({ title: "Failed to load received payments", description: "Something went wrong.", variant: "error" }); } finally { setLoading(false); } })(); }, [showToast]);
  return (
    <div className="max-w-6xl mx-auto mt-4 space-y-6">
      <div className="flex justify-between items-center"><Button variant="outline" onClick={() => router.back()}>Back to Received Payments</Button><h1 className="text-2xl font-bold text-center flex-1">Rejected Received Payments</h1></div>
      <div className="border rounded-md overflow-hidden bg-white"><table className="w-full text-sm"><thead className="bg-muted/60"><tr><th className="px-4 py-2 text-left">Payment No.</th><th className="px-4 py-2 text-left">Date</th><th className="px-4 py-2 text-left">Order</th><th className="px-4 py-2 text-left">Customer</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-left">Remark</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={6} className="px-4 py-4 text-center">Loading rejected received payments...</td></tr>
          : rows.length === 0 ? <tr><td colSpan={6} className="px-4 py-4 text-center">No rejected received payments found.</td></tr>
            : rows.map((x) => <tr key={x.id} className="border-t"><td className="px-4 py-2">{x.payment_number}</td><td className="px-4 py-2">{new Date(x.payment_date).toLocaleDateString()}</td><td className="px-4 py-2">{x.order_number}</td><td className="px-4 py-2">{x.customer_name}</td><td className="px-4 py-2 text-right">{Number(x.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td><td className="px-4 py-2">{x.status_remark || "—"}</td></tr>)}
      </tbody></table></div>
    </div>
  );
}
