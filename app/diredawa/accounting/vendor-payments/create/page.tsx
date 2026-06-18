"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
import { formatMoney } from "@/lib/utils";
  resolvePurchaseTotalFromPayments,
  sortReceivedPaymentsChronologically,
  sumPaymentsTowardRemaining,
} from "@/lib/receivedPaymentsBalance";

interface PurchaseOption {
  purchase_number: string;
  shipper: string;
  before_vat?: number;
}

interface VendorPayment {
  id?: string;
  purchase_number: string;
  payment_number?: string;
  payment_date?: string;
  amount: number;
  status?: string;
  installment_number?: number;
  remaining_amount?: number;
  purchase_total?: number;
}

const VP_API_URL = "/api/accounting/vendor-payments";
const PURCHASES_API_URL = "/api/purchases";

export default function CreateVendorPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [purchaseOptions, setPurchaseOptions] = useState<PurchaseOption[]>([]);
  const [existingPayments, setExistingPayments] = useState<VendorPayment[]>([]);
  const [form, setForm] = useState({
    payment_date: "",
    purchase_number: "",
    supplier_name: "",
    payment_type: "partial",
    amount: "",
    remark: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [purchasesRes, paymentsRes] = await Promise.all([
          fetch(PURCHASES_API_URL, { method: "GET", credentials: "include" }),
          fetch(VP_API_URL, { method: "GET", credentials: "include" }),
        ]);
        const purchasesData = await purchasesRes.json();
        const paymentsData = await paymentsRes.json();
        if (!purchasesRes.ok) {
          showToast({ title: "Failed to load purchases", description: purchasesData?.detail || "Please try again.", variant: "error" });
          return;
        }
        if (!paymentsRes.ok) {
          showToast({ title: "Failed to load vendor payments", description: paymentsData?.detail || "Please try again.", variant: "error" });
          return;
        }
        setPurchaseOptions(Array.isArray(purchasesData) ? purchasesData : []);
        setExistingPayments(Array.isArray(paymentsData) ? paymentsData : []);
      } catch {
        showToast({ title: "Failed to load form data", description: "Something went wrong.", variant: "error" });
      }
    })();
  }, [showToast]);

  const selectedPurchase = useMemo(
    () => purchaseOptions.find((p) => p.purchase_number === form.purchase_number),
    [purchaseOptions, form.purchase_number]
  );

  const remainingAmount = useMemo(() => {
    const pn = form.purchase_number;
    if (!pn) return 0;

    const forPurchase = existingPayments.filter((p) => p.purchase_number === pn);
    const sorted = sortReceivedPaymentsChronologically(forPurchase);

    const recorded = sumPaymentsTowardRemaining(sorted);
    const purchaseTotalFromPayments = resolvePurchaseTotalFromPayments(sorted);
    if (purchaseTotalFromPayments > 0) {
      return Math.max(0, purchaseTotalFromPayments - recorded);
    }
    if (!selectedPurchase) return 0;
    const purchaseTotal = Number(selectedPurchase.before_vat ?? 0);
    return Math.max(0, purchaseTotal - recorded);
  }, [form.purchase_number, selectedPurchase, existingPayments]);

  useEffect(() => {
    const prefillPurchase = searchParams.get("purchaseNumber");
    if (!prefillPurchase) return;
    setForm((prev) => ({
      ...prev,
      purchase_number: prefillPurchase,
      payment_type: "partial",
    }));
  }, [searchParams]);

  useEffect(() => {
    if (!form.purchase_number) {
      setForm((prev) => ({ ...prev, supplier_name: "", amount: "" }));
      return;
    }
    if (!selectedPurchase) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      supplier_name: selectedPurchase.shipper ?? "",
      amount: prev.payment_type === "full" ? String(remainingAmount) : prev.amount,
    }));
  }, [form.purchase_number, selectedPurchase, remainingAmount]);

  useEffect(() => {
    if (form.payment_type === "full") {
      setForm((prev) => ({ ...prev, amount: String(remainingAmount) }));
    }
  }, [form.payment_type, remainingAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.purchase_number) {
      showToast({ title: "Purchase required", description: "Please select a purchase.", variant: "error" });
      return;
    }
    if (remainingAmount <= 0) {
      showToast({ title: "Already fully paid", description: "Selected purchase is already fully paid.", variant: "error" });
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
      const res = await fetch(VP_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          payment_date: form.payment_date,
          purchase_number: form.purchase_number,
          payment_type: form.payment_type,
          amount: amountNum,
          remark: form.remark.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to create vendor payment", description: data?.detail || "Please try again.", variant: "error" });
        return;
      }
      showToast({ title: "Vendor payment created", variant: "success" });
      router.push("/diredawa/accounting/vendor-payments/display");
    } catch {
      showToast({ title: "Failed to create vendor payment", description: "Something went wrong.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-4 space-y-6">
      <div className="flex justify-start">
        <Button onClick={() => router.push("/diredawa/accounting/vendor-payments/display")}>Display Vendor Payments</Button>
      </div>
      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">Create Vendor Payment</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Payment Date *</label>
              <input type="date" className="w-full border rounded-md px-3 py-2" value={form.payment_date} onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Purchase *</label>
              <select className="w-full border rounded-md px-3 py-2" value={form.purchase_number} onChange={(e) => setForm((p) => ({ ...p, purchase_number: e.target.value }))} required>
                <option value="">Select purchase</option>
                {purchaseOptions.map((p) => (
                  <option key={p.purchase_number} value={p.purchase_number}>
                    {p.purchase_number}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier Name</label>
              <input className="w-full border rounded-md px-3 py-2 bg-muted/40" value={form.supplier_name} readOnly />
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
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border rounded-md px-3 py-2"
                value={form.amount}
                readOnly={form.payment_type === "full"}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Remaining: {formatMoney(remainingAmount)}</p>
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
