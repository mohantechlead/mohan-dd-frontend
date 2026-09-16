"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/authProvider";
import { money, formatDate } from "@/lib/warehouse";

interface WarehousePayment {
  id: string;
  payment_number: string;
  wsn_no: string;
  customer_name: string;
  payment_date: string;
  amount: number;
  payment_type: string;
  status: string;
  remark: string | null;
}

const API_URL = "/api/accounting/warehouse-storage-payments";

export default function WarehousePaymentApprovalsPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<WarehousePayment[]>([]);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    if (auth && !(auth.isAdmin || auth.isAccounting)) router.replace("/");
  }, [auth, router]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_URL, { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          showToast({
            title: "Failed to load warehouse payments",
            description: data?.detail || "Please try again.",
            variant: "error",
          });
          return;
        }
        setRows(
          (Array.isArray(data) ? data : []).filter(
            (x: WarehousePayment) => x.status === "pending"
          )
        );
      } catch {
        showToast({
          title: "Failed to load warehouse payments",
          description: "Something went wrong.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const handleApprove = async (paymentNumber: string) => {
    if (!auth?.userId) return;
    try {
      setApproving(paymentNumber);
      const res = await fetch(
        `/api/accounting/warehouse-storage-payments/${encodeURIComponent(paymentNumber)}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ approved_by_id: auth.userId }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to approve payment",
          description: data?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      setRows((prev) => prev.filter((x) => x.payment_number !== paymentNumber));
      showToast({ title: "Warehouse payment approved", variant: "success" });
    } catch {
      showToast({
        title: "Failed to approve payment",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/diredawa/accounting")}>
          Back to Accounting
        </Button>
        <h1 className="text-2xl font-bold">Warehouse Payment Approvals</h1>
        <div className="w-[150px]" />
      </div>

      <div className="border rounded-md overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-2 text-left">Payment No</th>
              <th className="px-4 py-2 text-left">WSN No</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Remark</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-center">
                  Loading pending warehouse payments...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-center text-muted-foreground">
                  No pending warehouse payments for approval.
                </td>
              </tr>
            ) : (
              rows.map((x) => (
                <tr key={x.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2 font-mono text-xs">{x.payment_number}</td>
                  <td className="px-4 py-2 font-mono text-xs">{x.wsn_no}</td>
                  <td className="px-4 py-2">{x.customer_name}</td>
                  <td className="px-4 py-2">{formatDate(x.payment_date)}</td>
                  <td className="px-4 py-2 text-right">{money(x.amount)}</td>
                  <td className="px-4 py-2 capitalize">{x.payment_type}</td>
                  <td className="px-4 py-2">{x.remark || "—"}</td>
                  <td className="px-4 py-2 text-center">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(x.payment_number)}
                      disabled={approving === x.payment_number}
                    >
                      {approving === x.payment_number ? "Approving..." : "Approve"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
