"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface VendorPayment {
  payment_number: string;
  payment_date: string;
  payment_type: string;
  amount: number;
  remaining_amount: number;
  remark?: string | null;
}

export default function EditVendorPaymentPage() {
  const params = useParams<{ paymentNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [form, setForm] = useState({
    payment_date: "",
    payment_type: "partial",
    amount: "",
    remark: "",
  });

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/accounting/vendor-payments/${encodeURIComponent(params.paymentNumber)}`, { method: "GET", credentials: "include" });
        const data = (await res.json()) as VendorPayment;
        if (!res.ok) {
          showToast({ title: "Failed to load vendor payment", description: (data as any)?.detail || "Please try again.", variant: "error" });
          return;
        }
        setRemainingAmount(Number(data.remaining_amount ?? 0) + Number(data.amount ?? 0));
        setForm({
          payment_date: data.payment_date,
          payment_type: data.payment_type,
          amount: String(data.amount),
          remark: data.remark ?? "",
        });
      } catch {
        showToast({ title: "Failed to load vendor payment", description: "Something went wrong.", variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    if (params.paymentNumber) fetchDetail();
  }, [params.paymentNumber, showToast]);

  useEffect(() => {
    if (form.payment_type === "full") {
      setForm((prev) => ({ ...prev, amount: String(remainingAmount) }));
    }
  }, [form.payment_type, remainingAmount]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(form.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      showToast({ title: "Invalid amount", description: "Amount must be greater than 0.", variant: "error" });
      return;
    }
    if (form.payment_type === "partial" && amountNum > remainingAmount) {
      showToast({ title: "Invalid amount", description: "Partial payment cannot exceed remaining amount.", variant: "error" });
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/accounting/vendor-payments/${encodeURIComponent(params.paymentNumber)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          payment_date: form.payment_date,
          payment_type: form.payment_type,
          amount: amountNum,
          remark: form.remark.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to update vendor payment", description: data?.detail || "Please try again.", variant: "error" });
        return;
      }
      showToast({ title: "Vendor payment updated", variant: "success" });
      router.push(`/diredawa/accounting/vendor-payments/${params.paymentNumber}`);
    } catch {
      showToast({ title: "Failed to update vendor payment", description: "Something went wrong.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>Back to Detail</Button>
        <h1 className="text-2xl font-bold flex-1 text-center">Edit Vendor Payment</h1>
        <div className="w-[140px]" />
      </div>
      {loading ? (
        <p className="text-center text-sm text-muted-foreground">Loading vendor payment...</p>
      ) : (
        <form onSubmit={handleSave} className="bg-white border rounded-md p-6 space-y-4 text-sm">
          <div>
            <label className="block font-medium mb-1">Payment Number</label>
            <input value={params.paymentNumber} readOnly className="w-full border rounded-md px-3 py-2 bg-muted/40" />
          </div>
          <div>
            <label className="block font-medium mb-1">Payment Date *</label>
            <input type="date" className="w-full border rounded-md px-3 py-2" value={form.payment_date} onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))} required />
          </div>
          <div>
            <label className="block font-medium mb-1">Payment Type *</label>
            <select className="w-full border rounded-md px-3 py-2" value={form.payment_type} onChange={(e) => setForm((p) => ({ ...p, payment_type: e.target.value }))} required>
              <option value="partial">Paritial</option>
              <option value="full">Full</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Amount *</label>
            <input type="number" min="0" step="0.01" className="w-full border rounded-md px-3 py-2" value={form.amount} readOnly={form.payment_type === "full"} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
            <p className="text-xs text-muted-foreground mt-1">Remaining: {remainingAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <label className="block font-medium mb-1">Remark</label>
            <textarea className="w-full border rounded-md px-3 py-2" rows={3} value={form.remark} onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push(`/diredawa/accounting/vendor-payments/${params.paymentNumber}`)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
