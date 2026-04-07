"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface ExpensePaymentPayload {
  expense_number: string;
  expense_date: string;
  payee: string;
  category: string;
  amount: number;
  description?: string | null;
}

const API_URL = "/api/accounting/expense-payments";
const NEXT_NUMBER_API_URL = "/api/accounting/expense-payments/next-number";

export default function CreateExpensePaymentPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    expense_number: "",
    expense_date: "",
    payee: "",
    category: "",
    amount: "",
    description: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(NEXT_NUMBER_API_URL, { method: "GET", credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const next =
          typeof data?.next_number === "string"
            ? data.next_number
            : typeof data?.next === "string"
              ? data.next
              : "";
        if (next && !cancelled) {
          setForm((prev) => ({ ...prev, expense_number: next }));
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast({ title: "Invalid amount", description: "Amount must be greater than 0.", variant: "error" });
      return;
    }

    const payload: ExpensePaymentPayload = {
      expense_number: form.expense_number.trim(),
      expense_date: form.expense_date,
      payee: form.payee.trim(),
      category: form.category.trim(),
      amount,
      description: form.description.trim() || null,
    };

    try {
      setSubmitting(true);
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to create expense payment",
          description: (data as { detail?: string; message?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Expense payment created", variant: "success" });
      router.push("/diredawa/accounting/expense-payments/display");
    } catch {
      showToast({
        title: "Failed to create expense payment",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-4 space-y-6">
      <div className="flex justify-start">
        <Button onClick={() => router.push("/diredawa/accounting/expense-payments/display")}>Display Expense Payments</Button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">Create Expense Payment</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Expense Number *</label>
              <input
                value={form.expense_number}
                onChange={(e) => setForm((prev) => ({ ...prev, expense_number: e.target.value }))}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expense Date *</label>
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm((prev) => ({ ...prev, expense_date: e.target.value }))}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payee *</label>
              <input
                value={form.payee}
                onChange={(e) => setForm((prev) => ({ ...prev, payee: e.target.value }))}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Amount *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full border rounded-md px-3 py-2"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
