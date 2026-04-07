"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface ExpensePayment {
  id: string;
  expense_number: string;
  expense_date: string;
  payee: string;
  category: string;
  amount: number;
  description?: string | null;
  status: string;
  reference_number?: string | null;
  status_remark?: string | null;
}

export default function ExpensePaymentDetailPage() {
  const params = useParams<{ expenseNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ExpensePayment | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/accounting/expense-payments/${encodeURIComponent(params.expenseNumber)}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          showToast({ title: "Failed to load expense payment", description: data?.detail || "Please try again.", variant: "error" });
          return;
        }
        setItem(data as ExpensePayment);
      } catch {
        showToast({ title: "Failed to load expense payment", description: "Something went wrong.", variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    if (params.expenseNumber) fetchDetail();
  }, [params.expenseNumber, showToast]);

  return (
    <div className="max-w-3xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>Back to Expense Payments</Button>
        <h1 className="text-2xl font-bold flex-1 text-center">Expense Payment Detail</h1>
        <div className="w-[180px]" />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center">Loading expense payment...</p>
      ) : !item ? (
        <p className="text-sm text-muted-foreground text-center">Expense payment not found.</p>
      ) : (
        <div className="bg-white border rounded-md p-6 space-y-3 text-sm">
          <div><span className="font-medium">Expense Number:</span> {item.expense_number}</div>
          <div><span className="font-medium">Date:</span> {new Date(item.expense_date).toLocaleDateString()}</div>
          <div><span className="font-medium">Payee:</span> {item.payee}</div>
          <div><span className="font-medium">Category:</span> {item.category}</div>
          <div><span className="font-medium">Amount:</span> {Number(item.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          <div><span className="font-medium">Status:</span> <span className="capitalize">{item.status}</span></div>
          <div><span className="font-medium">Reference No:</span> {item.reference_number || "—"}</div>
          <div><span className="font-medium">Remark:</span> {item.status_remark || "—"}</div>
          <div><span className="font-medium">Description:</span> {item.description || "—"}</div>
        </div>
      )}
    </div>
  );
}
