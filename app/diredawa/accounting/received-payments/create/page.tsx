"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface OrderOption {
  order_number: string;
  buyer: string;
  PR_before_VAT?: number;
}

interface ReceivedPayment {
  order_number: string;
  amount: number;
  status?: string;
}

const RP_API_URL = "/api/accounting/received-payments";
const ORDERS_API_URL = "/api/orders";

export default function CreateReceivedPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [orderOptions, setOrderOptions] = useState<OrderOption[]>([]);
  const [existingPayments, setExistingPayments] = useState<ReceivedPayment[]>([]);
  const [form, setForm] = useState({
    payment_date: "",
    order_number: "",
    customer_name: "",
    payment_type: "partial",
    amount: "",
    remark: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [ordersRes, paymentsRes] = await Promise.all([
          fetch(ORDERS_API_URL, { method: "GET", credentials: "include" }),
          fetch(RP_API_URL, { method: "GET", credentials: "include" }),
        ]);
        const ordersData = await ordersRes.json();
        const paymentsData = await paymentsRes.json();
        if (!ordersRes.ok) {
          showToast({ title: "Failed to load orders", description: ordersData?.detail || "Please try again.", variant: "error" });
          return;
        }
        if (!paymentsRes.ok) {
          showToast({ title: "Failed to load received payments", description: paymentsData?.detail || "Please try again.", variant: "error" });
          return;
        }
        setOrderOptions(Array.isArray(ordersData) ? ordersData : []);
        setExistingPayments(Array.isArray(paymentsData) ? paymentsData : []);
      } catch {
        showToast({ title: "Failed to load form data", description: "Something went wrong.", variant: "error" });
      }
    })();
  }, [showToast]);

  const selectedOrder = useMemo(
    () => orderOptions.find((o) => o.order_number === form.order_number),
    [orderOptions, form.order_number]
  );

  const remainingAmount = useMemo(() => {
    if (!selectedOrder) return 0;
    const orderTotal = Number(selectedOrder.PR_before_VAT ?? 0);
    const paid = existingPayments
      .filter(
        (p) =>
          p.order_number === selectedOrder.order_number &&
          (p.status === "approved" || p.status === "completed")
      )
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    return Math.max(0, orderTotal - paid);
  }, [selectedOrder, existingPayments]);

  useEffect(() => {
    const prefillOrder = searchParams.get("orderNumber");
    if (!prefillOrder) return;
    setForm((prev) => ({
      ...prev,
      order_number: prefillOrder,
      payment_type: "partial",
    }));
  }, [searchParams]);

  useEffect(() => {
    if (!selectedOrder) {
      setForm((prev) => ({ ...prev, customer_name: "", amount: "" }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      customer_name: selectedOrder.buyer ?? "",
      amount: prev.payment_type === "full" ? String(remainingAmount) : prev.amount,
    }));
  }, [selectedOrder, remainingAmount]);

  useEffect(() => {
    if (form.payment_type === "full") {
      setForm((prev) => ({ ...prev, amount: String(remainingAmount) }));
    }
  }, [form.payment_type, remainingAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.order_number) {
      showToast({ title: "Order required", description: "Please select an order.", variant: "error" });
      return;
    }
    if (remainingAmount <= 0) {
      showToast({ title: "Already fully paid", description: "Selected order is already fully paid.", variant: "error" });
      return;
    }
    const amountNum = Number(form.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      showToast({ title: "Invalid amount", description: "Amount must be greater than 0.", variant: "error" });
      return;
    }
    if (form.payment_type === "partial" && amountNum > remainingAmount) {
      showToast({ title: "Invalid partial amount", description: "Partial payment cannot exceed remaining amount.", variant: "error" });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(RP_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          payment_date: form.payment_date,
          order_number: form.order_number,
          payment_type: form.payment_type,
          amount: amountNum,
          remark: form.remark.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to create received payment", description: data?.detail || "Please try again.", variant: "error" });
        return;
      }
      showToast({ title: "Received payment created", variant: "success" });
      router.push("/diredawa/accounting/received-payments/display");
    } catch {
      showToast({ title: "Failed to create received payment", description: "Something went wrong.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-4 space-y-6">
      <div className="flex justify-start">
        <Button onClick={() => router.push("/diredawa/accounting/received-payments/display")}>Display Received Payments</Button>
      </div>
      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">Create Received Payment</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Payment Date *</label>
              <input type="date" className="w-full border rounded-md px-3 py-2" value={form.payment_date} onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Order *</label>
              <select className="w-full border rounded-md px-3 py-2" value={form.order_number} onChange={(e) => setForm((p) => ({ ...p, order_number: e.target.value }))} required>
                <option value="">Select order</option>
                {orderOptions.map((o) => (
                  <option key={o.order_number} value={o.order_number}>{o.order_number}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name</label>
              <input className="w-full border rounded-md px-3 py-2 bg-muted/40" value={form.customer_name} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Type *</label>
              <select className="w-full border rounded-md px-3 py-2" value={form.payment_type} onChange={(e) => setForm((p) => ({ ...p, payment_type: e.target.value }))} required>
                <option value="partial">Paritial</option>
                <option value="full">Full</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount *</label>
              <input type="number" min="0" step="0.01" className="w-full border rounded-md px-3 py-2" value={form.amount} readOnly={form.payment_type === "full"} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
              <p className="text-xs text-muted-foreground mt-1">Remaining: {remainingAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Remark</label>
              <textarea className="w-full border rounded-md px-3 py-2" rows={3} value={form.remark} onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
