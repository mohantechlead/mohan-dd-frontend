"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/authProvider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReceivedPayment { id: string; payment_number: string; order_number: string; installment_number?: number; status: string; }
const API_URL = "/api/accounting/received-payments";

export default function ReceivedPaymentStatusPage() {
  const router = useRouter(); const auth = useAuth(); const { showToast } = useToast();
  const [loading, setLoading] = useState(true); const [rows, setRows] = useState<ReceivedPayment[]>([]);
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [action, setAction] = useState<"completed" | "cancelled">("completed");
  const [referenceNumber, setReferenceNumber] = useState(""); const [remark, setRemark] = useState("");

  useEffect(() => { if (auth && !(auth.isAdmin || auth.isAccounting)) router.replace("/"); }, [auth, router]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_URL, { method: "GET", credentials: "include" }); const data = await res.json();
        if (!res.ok) { showToast({ title: "Failed to load received payments", description: data?.detail || "Please try again.", variant: "error" }); return; }
        const allRows: ReceivedPayment[] = Array.isArray(data) ? data : [];
        const byOrder = new Map<string, ReceivedPayment[]>(); for (const row of allRows) { const k = row.order_number; const list = byOrder.get(k) ?? []; list.push(row); byOrder.set(k, list); }
        const eligible: ReceivedPayment[] = [];
        for (const [, payments] of byOrder) { if (!payments.every((p) => p.status === "approved")) continue; const sorted = [...payments].sort((a, b) => (a.installment_number ?? 0) - (b.installment_number ?? 0)); eligible.push(sorted[sorted.length - 1]); }
        setRows(eligible);
      } catch { showToast({ title: "Failed to load received payments", description: "Something went wrong.", variant: "error" }); }
      finally { setLoading(false); }
    })();
  }, [showToast]);

  const openPopup = (paymentNumber: string, nextAction: "completed" | "cancelled") => { setSelectedNumber(paymentNumber); setAction(nextAction); setReferenceNumber(""); setRemark(""); setOpen(true); };
  const handleSubmit = async () => {
    if (!selectedNumber || !auth?.userId) return;
    if (action === "completed" && !referenceNumber.trim()) { showToast({ title: "Reference number required", description: "Please provide a reference number for completed received payment.", variant: "error" }); return; }
    if (action === "cancelled" && !remark.trim()) { showToast({ title: "Remark required", description: "Please provide a remark when cancelling received payment.", variant: "error" }); return; }
    try {
      setBusy(true);
      const res = await fetch(`/api/accounting/received-payments/${encodeURIComponent(selectedNumber)}/update-status`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ status: action, user_id: auth.userId, reference_number: action === "completed" ? referenceNumber.trim() : undefined, remark: action === "cancelled" ? remark.trim() : undefined }),
      });
      const data = await res.json();
      if (!res.ok) { showToast({ title: "Failed to update status", description: data?.detail || "Please try again.", variant: "error" }); return; }
      setRows((prev) => prev.filter((x) => x.payment_number !== selectedNumber)); showToast({ title: `Received payment ${action}`, variant: "success" }); setOpen(false); setSelectedNumber(null);
    } catch { showToast({ title: "Failed to update status", description: "Something went wrong.", variant: "error" }); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-4">
      <h1 className="text-2xl font-bold">Update Received Payment Status</h1>
      <div className="border rounded-md overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/60"><tr><th className="px-4 py-2 text-left">Order</th><th className="px-4 py-2 text-left">Last Payment</th><th className="px-4 py-2 text-left">Status</th><th className="px-4 py-2 text-left">Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="px-4 py-4 text-center">Loading eligible received payments...</td></tr>
              : rows.length === 0 ? <tr><td colSpan={4} className="px-4 py-4 text-center">No received payments where all installments are approved.</td></tr>
                : rows.map((x) => (
                  <tr key={x.id} className="border-t">
                    <td className="px-4 py-2">{x.order_number}</td><td className="px-4 py-2">{`Last Payment ${x.installment_number ?? 1}`}</td><td className="px-4 py-2 capitalize">{x.status}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => router.push(`/diredawa/accounting/received-payments/order/${encodeURIComponent(x.order_number)}`)}><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" style={{ backgroundColor: "#16a34a", color: "white" }} className="hover:opacity-90" onClick={() => openPopup(x.payment_number, "completed")}>Completed</Button>
                      <Button size="sm" variant="destructive" onClick={() => openPopup(x.payment_number, "cancelled")}>Cancelled</Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{action === "completed" ? "Mark as Completed" : "Mark as Cancelled"}</DialogTitle></DialogHeader>
        <div className="space-y-3">{action === "completed" ? <div className="space-y-1"><Label htmlFor="reference_number">Reference Number *</Label><Input id="reference_number" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} /></div> : <div className="space-y-1"><Label htmlFor="remark">Remark *</Label><Input id="remark" value={remark} onChange={(e) => setRemark(e.target.value)} /></div>}</div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button><Button onClick={handleSubmit} disabled={busy} style={action === "completed" ? { backgroundColor: "#16a34a", color: "white" } : undefined}>{busy ? "Updating..." : action === "completed" ? "Complete" : "Cancel Received Payment"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}

