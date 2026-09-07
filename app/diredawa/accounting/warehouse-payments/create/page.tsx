"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import { WSP_API_URL, WSN_API_URL, money } from "@/lib/warehouse";

interface WSNOption {
  id: string;
  wsn_no: string;
  customer_name: string;
  storage_price: number;
}

interface ExistingPayment {
  wsn_no: string;
  amount: number;
  status: string;
  payment_type: string;
}

export default function CreateWarehousePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [wsnOptions, setWsnOptions] = useState<WSNOption[]>([]);
  const [existingPayments, setExistingPayments] = useState<ExistingPayment[]>([]);

  const [form, setForm] = useState({
    payment_date: "",
    wsn_no: searchParams.get("wsn_no") || "",
    payment_type: "partial",
    amount: "",
    remark: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [wsnRes, paymentsRes] = await Promise.all([
          fetch(WSN_API_URL, { credentials: "include" }),
          fetch(WSP_API_URL, { credentials: "include" }),
        ]);
        const wsnData = await wsnRes.json();
        const paymentsData = await paymentsRes.json();
        if (wsnRes.ok) setWsnOptions(Array.isArray(wsnData) ? wsnData : []);
        if (paymentsRes.ok) setExistingPayments(Array.isArray(paymentsData) ? paymentsData : []);
      } catch {
        showToast({ title: "Failed to load data", description: "Something went wrong.", variant: "error" });
      }
    };
    load();
  }, [showToast]);

  const selectedWSN = useMemo(
    () => wsnOptions.find((w) => w.wsn_no === form.wsn_no),
    [wsnOptions, form.wsn_no]
  );

  const remainingAmount = useMemo(() => {
    if (!form.wsn_no || !selectedWSN) return 0;
    const paid = existingPayments
      .filter((p) => p.wsn_no === form.wsn_no && (p.status === "approved" || p.status === "completed"))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return Math.max(0, Number(selectedWSN.storage_price || 0) - paid);
  }, [form.wsn_no, selectedWSN, existingPayments]);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.wsn_no) {
      showToast({ title: "Validation error", description: "Please select a storage note.", variant: "error" });
      return;
    }
    if (!form.payment_date) {
      showToast({ title: "Validation error", description: "Payment date is required.", variant: "error" });
      return;
    }
    if (form.payment_type === "partial" && (!form.amount || Number(form.amount) <= 0)) {
      showToast({ title: "Validation error", description: "Amount is required for partial payment.", variant: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        payment_date: form.payment_date,
        wsn_no: form.wsn_no,
        payment_type: form.payment_type,
        remark: form.remark.trim() || null,
      };
      if (form.payment_type === "partial") body.amount = Number(form.amount);

      const res = await fetch(WSP_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to create payment", description: formatApiErrorMessage(data), variant: "error" });
        return;
      }
      showToast({ title: "Payment created", description: `Payment ${data.payment_number} created.`, variant: "success" });
      router.push("/diredawa/accounting/warehouse-payments/display");
    } catch {
      showToast({ title: "Failed to create payment", description: "Something went wrong.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/diredawa/accounting/warehouse-payments/display")}>
          Back to Payments
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold">Create Warehouse Storage Payment</h1>
        </div>
        <div className="w-[150px]" />
      </div>

      <form onSubmit={handleSubmit} className="border rounded-md bg-white p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="wsn_no">Storage Note (WSN) *</Label>
            <select
              id="wsn_no"
              required
              value={form.wsn_no}
              onChange={(e) => updateForm("wsn_no", e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select a storage note...</option>
              {wsnOptions.map((w) => (
                <option key={w.wsn_no} value={w.wsn_no}>
                  {w.wsn_no} — {w.customer_name} (Price: {money(w.storage_price)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="payment_date">Payment Date *</Label>
            <Input
              id="payment_date"
              type="date"
              required
              value={form.payment_date}
              onChange={(e) => updateForm("payment_date", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="payment_type">Payment Type *</Label>
            <select
              id="payment_type"
              required
              value={form.payment_type}
              onChange={(e) => updateForm("payment_type", e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="partial">Partial</option>
              <option value="full">Full</option>
            </select>
          </div>
          {form.payment_type === "partial" && (
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="any"
                required
                value={form.amount}
                onChange={(e) => updateForm("amount", e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}
        </div>

        {selectedWSN && (
          <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
            <div>Customer: <strong>{selectedWSN.customer_name}</strong></div>
            <div>Storage Price: <strong>{money(selectedWSN.storage_price)}</strong></div>
            <div>Remaining to pay: <strong>{money(remainingAmount)}</strong></div>
          </div>
        )}

        <div>
          <Label htmlFor="remark">Remark</Label>
          <Input
            id="remark"
            value={form.remark}
            onChange={(e) => updateForm("remark", e.target.value)}
            placeholder="Optional remark"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.push("/diredawa/accounting/warehouse-payments/display")}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Payment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
