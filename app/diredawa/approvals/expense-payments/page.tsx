"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/authProvider";

interface ExpensePayment {
  id: string;
  expense_number: string;
  status: string;
}

const API_URL = "/api/accounting/expense-payments";

export default function ExpensePaymentApprovalsPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ExpensePayment[]>([]);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    if (auth && !(auth.isAdmin || auth.isAccounting)) router.replace("/");
  }, [auth, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_URL, { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          showToast({ title: "Failed to load expense payments", description: data?.detail || "Please try again.", variant: "error" });
          return;
        }
        setRows((Array.isArray(data) ? data : []).filter((x: ExpensePayment) => x.status === "pending"));
      } catch {
        showToast({ title: "Failed to load expense payments", description: "Something went wrong.", variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  const handleApprove = async (expenseNumber: string) => {
    if (!auth?.userId) return;
    try {
      setApproving(expenseNumber);
      const res = await fetch(`/api/accounting/expense-payments/${encodeURIComponent(expenseNumber)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ approved_by_id: auth.userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to approve expense payment", description: data?.detail || "Please try again.", variant: "error" });
        return;
      }
      setRows((prev) => prev.filter((x) => x.expense_number !== expenseNumber));
      showToast({ title: "Expense payment approved", variant: "success" });
    } catch {
      showToast({ title: "Failed to approve expense payment", description: "Something went wrong.", variant: "error" });
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-4">
      <h1 className="text-2xl font-bold">Expense Payment Approvals</h1>
      <div className="border rounded-md overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-2 text-left">Expense Number</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-4 text-center">Loading pending expense payments...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-4 text-center">No pending expense payments for approval.</td></tr>
            ) : (
              rows.map((x) => (
                <tr key={x.id} className="border-t">
                  <td className="px-4 py-2">{x.expense_number}</td>
                  <td className="px-4 py-2 capitalize">{x.status}</td>
                  <td className="px-4 py-2">
                    <Button size="sm" onClick={() => handleApprove(x.expense_number)} disabled={approving === x.expense_number}>
                      {approving === x.expense_number ? "Approving..." : "Approve"}
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

