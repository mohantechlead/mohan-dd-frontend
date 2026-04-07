"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface VendorPayment {
  payment_number: string;
  payment_date: string;
  purchase_number: string;
  supplier_name: string;
  payment_type: string;
  amount: number;
  purchase_total: number;
  total_paid: number;
  remaining_amount: number;
  payment_completion_status: string;
  remark?: string | null;
}

export default function VendorPaymentDetailPage() {
  const params = useParams<{ paymentNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<VendorPayment | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/accounting/vendor-payments/${encodeURIComponent(params.paymentNumber)}`, { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          showToast({ title: "Failed to load vendor payment", description: data?.detail || "Please try again.", variant: "error" });
          return;
        }
        setItem(data as VendorPayment);
      } catch {
        showToast({ title: "Failed to load vendor payment", description: "Something went wrong.", variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    if (params.paymentNumber) fetchDetail();
  }, [params.paymentNumber, showToast]);

  return (
    <div className="max-w-3xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>Back to Vendor Payments</Button>
        <h1 className="text-2xl font-bold flex-1 text-center">Vendor Payment Detail</h1>
        <div className="w-[180px]" />
      </div>
      {loading ? (
        <p className="text-center text-sm text-muted-foreground">Loading vendor payment...</p>
      ) : !item ? (
        <p className="text-center text-sm text-muted-foreground">Vendor payment not found.</p>
      ) : (
        <div className="bg-white border rounded-md p-6 space-y-2 text-sm">
          <div><span className="font-medium">Payment Number:</span> {item.payment_number}</div>
          <div><span className="font-medium">Payment Date:</span> {new Date(item.payment_date).toLocaleDateString()}</div>
          <div><span className="font-medium">Purchase Number:</span> {item.purchase_number}</div>
          <div><span className="font-medium">Supplier Name:</span> {item.supplier_name}</div>
          <div><span className="font-medium">Payment Type:</span> <span className="capitalize">{item.payment_type}</span></div>
          <div><span className="font-medium">Amount:</span> {item.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          <div><span className="font-medium">Purchase Total:</span> {item.purchase_total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          <div><span className="font-medium">Total Paid:</span> {item.total_paid.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          <div><span className="font-medium">Remaining Amount:</span> {item.remaining_amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          <div><span className="font-medium">Completion Status:</span> <span className="capitalize">{item.payment_completion_status}</span></div>
          <div><span className="font-medium">Remark:</span> {item.remark || "—"}</div>
          <div className="pt-2">
            <Button variant="outline" onClick={() => router.push(`/diredawa/accounting/vendor-payments/${item.payment_number}/edit`)}>
              Edit Vendor Payment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
