"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface ExpensePayment {
  id: string;
  expense_number: string;
  expense_date: string;
  payee: string;
  category: string;
  amount: number;
  status: string;
  reference_number?: string | null;
}

const API_URL = "/api/accounting/expense-payments";

export default function CompletedExpensePaymentsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ExpensePayment[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_URL, { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          showToast({ title: "Failed to load expense payments", description: data?.detail || "Please try again.", variant: "error" });
          return;
        }
        setRows((Array.isArray(data) ? data : []).filter((x: ExpensePayment) => x.status === "completed"));
      } catch {
        showToast({ title: "Failed to load expense payments", description: "Something went wrong.", variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  return (
    <div className="max-w-5xl mx-auto mt-4 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()}>Back to Expense Payments</Button>
        <h1 className="text-2xl font-bold text-center flex-1">Completed Expense Payments</h1>
      </div>
      <div className="border rounded-md overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-2 text-left">Expense No.</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Payee</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-left">Ref No</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-4 text-center">Loading completed expense payments...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-4 text-center">No completed expense payments found.</td></tr>
            ) : (
              rows.map((x) => (
                <tr key={x.id} className="border-t">
                  <td className="px-4 py-2">{x.expense_number}</td>
                  <td className="px-4 py-2">{new Date(x.expense_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{x.payee}</td>
                  <td className="px-4 py-2">{x.category}</td>
                  <td className="px-4 py-2 text-right">{Number(x.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2">{x.reference_number || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
