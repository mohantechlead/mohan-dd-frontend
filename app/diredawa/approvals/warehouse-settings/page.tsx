"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/authProvider";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import {
  WSN_SETTINGS_APPROVALS_URL,
  WSN_SETTINGS_APPROVAL_APPROVE_URL,
  WSN_SETTINGS_APPROVAL_REJECT_URL,
  money,
  formatDate,
  type WarehouseSettingsApproval,
} from "@/lib/warehouse";

function changeTypeLabel(approval: WarehouseSettingsApproval): string {
  return approval.change_type === "price" ? "Storage Price" : "Expiration Fee Tiers";
}

function payloadSummary(approval: WarehouseSettingsApproval): string {
  if (approval.change_type === "price") {
    const price = approval.payload?.storage_price;
    const currency = approval.payload?.currency;
    return `New price: ${money(price, currency)}`;
  }
  const tiers = approval.payload?.expiration_fee_tiers ?? [];
  if (tiers.length === 0) return "Clear all tiers";
  const currency = approval.payload?.currency;
  return tiers
    .map(
      (t) =>
        `#${t.tier_index}: ${money(t.fee_amount, currency)} per ${t.period_value} ${t.period_unit}`,
    )
    .join(" · ");
}

export default function WarehouseSettingsApprovalsPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const [approvals, setApprovals] = useState<WarehouseSettingsApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (auth && !(auth.isAdmin || auth.isAccounting)) router.replace("/");
  }, [auth, router]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(WSN_SETTINGS_APPROVALS_URL, {
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
      setApprovals(data as WarehouseSettingsApproval[]);
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

  const act = async (id: string, kind: "approve" | "reject") => {
    setActionId(id);
    try {
      const url =
        kind === "approve"
          ? WSN_SETTINGS_APPROVAL_APPROVE_URL(id)
          : WSN_SETTINGS_APPROVAL_REJECT_URL(id);
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
      showToast({
        title: kind === "approve" ? "Approved" : "Rejected",
        description: changeTypeLabel(data as WarehouseSettingsApproval),
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

  const pending = approvals.filter((a) => a.status === "pending");
  const reviewed = approvals.filter((a) => a.status !== "pending");

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold">Warehouse Settings Approval</h1>
      <p className="text-sm text-muted-foreground">
        Storage price and expiration fee tier changes proposed by Accounting take
        effect only after they are approved here.
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
                  <th className="px-4 py-2 text-left">WSN #</th>
                  <th className="px-4 py-2 text-left">Customer</th>
                  <th className="px-4 py-2 text-left">Change</th>
                  <th className="px-4 py-2 text-left">Proposed Value</th>
                  <th className="px-4 py-2 text-left">Proposed By</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{a.wsn_no}</td>
                    <td className="px-4 py-2">{a.customer_name}</td>
                    <td className="px-4 py-2">{changeTypeLabel(a)}</td>
                    <td className="px-4 py-2">{payloadSummary(a)}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {a.proposed_by || "—"}
                      {a.proposed_at ? ` on ${formatDate(a.proposed_at)}` : ""}
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
                  <th className="px-4 py-2 text-left">WSN #</th>
                  <th className="px-4 py-2 text-left">Change</th>
                  <th className="px-4 py-2 text-left">Proposed Value</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Reviewed By</th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{a.wsn_no}</td>
                    <td className="px-4 py-2">{changeTypeLabel(a)}</td>
                    <td className="px-4 py-2">{payloadSummary(a)}</td>
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
                      {a.reviewed_at ? ` on ${formatDate(a.reviewed_at)}` : ""}
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
