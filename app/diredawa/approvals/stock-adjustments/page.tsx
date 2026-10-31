"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/authProvider";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import { formatQuantityDisplay } from "@/lib/inventoryQuantity";
import {
  STOCK_ADJUSTMENTS_URL,
  STOCK_ADJUSTMENT_APPROVE_URL,
  STOCK_ADJUSTMENT_REJECT_URL,
  reasonLabel,
  formatAdjustmentDate,
  type StockAdjustment,
} from "@/lib/stockAdjustments";

function quantitySummary(adjustment: StockAdjustment): string {
  const qty = formatQuantityDisplay(adjustment.quantity);
  const unit = adjustment.unit_measurement ? ` ${adjustment.unit_measurement}` : "";
  const bags =
    adjustment.bags !== null && adjustment.bags !== undefined
      ? ` · ${formatQuantityDisplay(adjustment.bags)} bags`
      : "";
  return `${qty}${unit}${bags}`;
}

export default function StockAdjustmentApprovalsPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    if (auth && !(auth.isAdmin || auth.isAccounting)) router.replace("/");
  }, [auth, router]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(STOCK_ADJUSTMENTS_URL, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to load",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      setAdjustments(data as StockAdjustment[]);
    } catch {
      showToast({
        title: "Failed to load",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: number, kind: "approve" | "reject") => {
    setActionId(id);
    try {
      const url =
        kind === "approve"
          ? STOCK_ADJUSTMENT_APPROVE_URL(id)
          : STOCK_ADJUSTMENT_REJECT_URL(id);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ remark: null }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: kind === "approve" ? "Failed to approve" : "Failed to reject",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      const updated = data as StockAdjustment;
      showToast({
        title: kind === "approve" ? "Approved" : "Rejected",
        description:
          kind === "approve"
            ? `${updated.item_name} adjustment will now reduce stock.`
            : `${updated.item_name} adjustment was rejected.`,
        variant: kind === "approve" ? "success" : "warning",
      });
      await load();
    } catch {
      showToast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "error",
      });
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  const pending = adjustments.filter((a) => a.status === "pending");
  const reviewed = adjustments.filter((a) => a.status !== "pending");

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold">Stock Adjustment Approval</h1>
      <p className="text-sm text-muted-foreground">
        Lost and contaminated stock write-offs take effect only after they are
        approved here. Pending or rejected adjustments never reduce stock.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Pending</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        ) : (
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Reason</th>
                  <th className="px-4 py-2 text-left">Quantity</th>
                  <th className="px-4 py-2 text-left">Requested By</th>
                  <th className="px-4 py-2 text-left">Note</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2">{formatAdjustmentDate(a.date)}</td>
                    <td className="px-4 py-2 font-medium">{a.item_name}</td>
                    <td className="px-4 py-2">{a.code || "—"}</td>
                    <td className="px-4 py-2">{reasonLabel(a.reason)}</td>
                    <td className="px-4 py-2">{quantitySummary(a)}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {a.adjusted_by || "—"}
                      {a.created_at ? ` on ${formatAdjustmentDate(a.created_at)}` : ""}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {a.note || "—"}
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <Button
                        size="sm"
                        disabled={actionId === a.id}
                        onClick={() => act(a.id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={actionId === a.id}
                        onClick={() => act(a.id, "reject")}
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recently Reviewed</h2>
        {reviewed.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing reviewed yet.</p>
        ) : (
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Reason</th>
                  <th className="px-4 py-2 text-left">Quantity</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Reviewed By</th>
                  <th className="px-4 py-2 text-left">Remark</th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2">{formatAdjustmentDate(a.date)}</td>
                    <td className="px-4 py-2 font-medium">{a.item_name}</td>
                    <td className="px-4 py-2">{a.code || "—"}</td>
                    <td className="px-4 py-2">{reasonLabel(a.reason)}</td>
                    <td className="px-4 py-2">{quantitySummary(a)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          a.status === "approved"
                            ? "inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800"
                            : "inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800"
                        }
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {a.reviewed_by || "—"}
                      {a.reviewed_at ? ` on ${formatAdjustmentDate(a.reviewed_at)}` : ""}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {a.review_remark || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
