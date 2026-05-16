"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  resolveOrderTotalFromPayments,
  sortReceivedPaymentsChronologically,
  sumPaymentsTowardRemaining,
} from "@/lib/receivedPaymentsBalance";

interface ReceivedPayment {
  id: string;
  payment_number?: string;
  installment_number?: number;
  payment_date: string;
  order_number: string;
  customer_name: string;
  payment_type: string;
  amount: number;
  status: string;
  order_total: number;
  remaining_amount: number;
}

const API_URL = "/api/accounting/received-payments";

export default function ReceivedPaymentOrderSummaryPage() {
  const params = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ReceivedPayment[]>([]);

  useEffect(() => {
    const fetchRows = async () => {
      try {
        const res = await fetch(API_URL, { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          showToast({ title: "Failed to load received payments", description: data?.detail || "Please try again.", variant: "error" });
          return;
        }
        const all = Array.isArray(data) ? (data as ReceivedPayment[]) : [];
        setRows(all.filter((x) => x.order_number === params.orderNumber));
      } catch {
        showToast({ title: "Failed to load received payments", description: "Something went wrong.", variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    if (params.orderNumber) fetchRows();
  }, [params.orderNumber, showToast]);

  const sortedRows = useMemo(() => sortReceivedPaymentsChronologically(rows), [rows]);

  const summary = useMemo(() => {
    if (sortedRows.length === 0) {
      return {
        customer_name: "",
        order_total: 0,
        approved_paid: 0,
        recorded_incl_pending: 0,
        remaining_amount: 0,
      };
    }
    const latest = sortedRows[sortedRows.length - 1];
    const orderTotal = resolveOrderTotalFromPayments(sortedRows);
    const approvedPaid = sortedRows
      .filter((x) => {
        const s = (x.status ?? "").toLowerCase();
        return s === "approved" || s === "completed";
      })
      .reduce((sum, x) => sum + Number(x.amount ?? 0), 0);
    const recordedInclPending = sumPaymentsTowardRemaining(sortedRows);
    const remaining =
      orderTotal > 0
        ? Math.max(0, orderTotal - recordedInclPending)
        : Math.max(0, Number(latest.remaining_amount ?? 0));
    return {
      customer_name: latest.customer_name,
      order_total: orderTotal > 0 ? orderTotal : Number(latest.order_total ?? 0),
      approved_paid: approvedPaid,
      recorded_incl_pending: recordedInclPending,
      remaining_amount: remaining,
    };
  }, [sortedRows]);

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>Back to Received Payments</Button>
        <h1 className="text-2xl font-bold flex-1 text-center">Received Payment Summary</h1>
        <div className="w-[180px]" />
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground text-center">Loading payment summary...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center">No payments found for this order.</p>
      ) : (
        <>
          <div className="bg-white border rounded-md p-4 text-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div><span className="font-medium">Order:</span> {params.orderNumber}</div>
            <div><span className="font-medium">Customer:</span> {summary.customer_name}</div>
            <div><span className="font-medium">Order Total:</span> {summary.order_total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <div><span className="font-medium">Approved Paid:</span> {summary.approved_paid.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <div><span className="font-medium">Recorded (incl. pending):</span> {summary.recorded_incl_pending.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <div><span className="font-medium">Remaining:</span> {summary.remaining_amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left">Payment</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((x) => (
                  <tr key={x.id} className="border-t">
                    <td className="px-4 py-2">{`Payment ${x.installment_number ?? 1}`}</td>
                    <td className="px-4 py-2">{new Date(x.payment_date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 capitalize">{x.payment_type}</td>
                    <td className="px-4 py-2 text-right">{Number(x.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 capitalize">{x.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
