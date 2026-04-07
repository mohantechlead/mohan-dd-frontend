"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function EditExpensePaymentPage() {
  const params = useParams<{ expenseNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    expense_date: "",
    payee: "",
    category: "",
    amount: "",
    description: "",
  });

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
        setForm({
          expense_date: data?.expense_date ?? "",
          payee: data?.payee ?? "",
          category: data?.category ?? "",
          amount: String(data?.amount ?? ""),
          description: data?.description ?? "",
        });
      } catch {
        showToast({ title: "Failed to load expense payment", description: "Something went wrong.", variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    if (params.expenseNumber) fetchDetail();
  }, [params.expenseNumber, showToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast({ title: "Invalid amount", description: "Amount must be greater than 0.", variant: "error" });
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/accounting/expense-payments/${encodeURIComponent(params.expenseNumber)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          expense_date: form.expense_date,
          payee: form.payee.trim(),
          category: form.category.trim(),
          amount,
          description: form.description.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to update expense payment", description: data?.detail || "Please try again.", variant: "error" });
        return;
      }
      showToast({ title: "Expense payment updated", variant: "success" });
      router.push(`/diredawa/accounting/expense-payments/${params.expenseNumber}`);
    } catch {
      showToast({ title: "Failed to update expense payment", description: "Something went wrong.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>Back to Detail</Button>
        <h1 className="text-2xl font-bold flex-1 text-center">Edit Expense Payment</h1>
        <div className="w-[140px]" />
      </div>
      {loading ? (
        <p className="text-center text-sm text-muted-foreground">Loading expense payment...</p>
      ) : (
        <form onSubmit={handleSave} className="bg-white border rounded-md p-6 space-y-4 text-sm">
          <div>
            <label className="block font-medium mb-1">Expense Number</label>
            <input value={params.expenseNumber} readOnly className="w-full border rounded-md px-3 py-2 bg-muted/40" />
          </div>
          <div>
            <label className="block font-medium mb-1">Expense Date *</label>
            <input type="date" value={form.expense_date} onChange={(e) => setForm((p) => ({ ...p, expense_date: e.target.value }))} className="w-full border rounded-md px-3 py-2" required />
          </div>
          <div>
            <label className="block font-medium mb-1">Payee *</label>
            <input value={form.payee} onChange={(e) => setForm((p) => ({ ...p, payee: e.target.value }))} className="w-full border rounded-md px-3 py-2" required />
          </div>
          <div>
            <label className="block font-medium mb-1">Category *</label>
            <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full border rounded-md px-3 py-2" required />
          </div>
          <div>
            <label className="block font-medium mb-1">Amount *</label>
            <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className="w-full border rounded-md px-3 py-2" required />
          </div>
          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full border rounded-md px-3 py-2" rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push(`/diredawa/accounting/expense-payments/${params.expenseNumber}`)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
