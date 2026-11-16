"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CheckCircle2, Eye, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/authProvider";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import { stageLabel } from "@/components/stage-display";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TRANSIT_ADVANCES_URL,
  TRANSIT_ADVANCE_APPROVE_URL,
  TRANSIT_ADVANCE_REJECT_URL,
  advanceMoney,
  formatAdvanceDate,
  transitAdvanceStatusClass,
  transitAdvanceStatusLabel,
  type TransitAdvance,
  type TransitAdvanceDetail,
} from "@/lib/transit-advances";

function AdvanceSummary({ advance }: { advance: TransitAdvance }) {
  return (
    <div className="space-y-2 rounded-md border bg-slate-50 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-slate-800">
          {advanceMoney(advance.amount, advance.currency)}
        </span>
        <span className={transitAdvanceStatusClass(advance.status)}>
          {transitAdvanceStatusLabel(advance.status, advance.status_label)}
        </span>
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="inline font-medium text-slate-700">Purchase: </dt>
          <dd className="inline">{advance.purchase_number}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-slate-700">Requested by: </dt>
          <dd className="inline">{advance.requested_by || "—"}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-slate-700">Requested: </dt>
          <dd className="inline">{formatAdvanceDate(advance.requested_at)}</dd>
        </div>
        {advance.reviewed_by && (
          <div>
            <dt className="inline font-medium text-slate-700">Reviewed by: </dt>
            <dd className="inline">{advance.reviewed_by}</dd>
          </div>
        )}
        {advance.reviewed_at && (
          <div>
            <dt className="inline font-medium text-slate-700">Reviewed: </dt>
            <dd className="inline">{formatAdvanceDate(advance.reviewed_at)}</dd>
          </div>
        )}
      </dl>
      {advance.note && (
        <p className="text-slate-600">
          <span className="font-medium text-slate-700">Note: </span>
          {advance.note}
        </p>
      )}
      {advance.review_remark && (
        <p className="text-slate-600">
          <span className="font-medium text-slate-700">Remark: </span>
          {advance.review_remark}
        </p>
      )}
    </div>
  );
}

function PurchaseSummary({ detail }: { detail: TransitAdvanceDetail }) {
  const p = detail.purchase;
  const bl = p.bill_of_lading;
  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-white px-3 py-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
          <span className="font-semibold text-blue-600">{p.purchase_number}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {p.stage_label || stageLabel(p.stage)}
          </span>
        </div>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 pt-2 text-slate-600 sm:grid-cols-2">
          <div>
            <dt className="inline font-medium text-slate-700">Buyer: </dt>
            <dd className="inline">{p.buyer || "—"}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-700">Shipper: </dt>
            <dd className="inline">{p.shipper || "—"}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-700">Proforma: </dt>
            <dd className="inline">{p.proforma_ref_no || "—"}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-700">Order date: </dt>
            <dd className="inline">
              {p.order_date
                ? new Date(p.order_date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-700">Transitor: </dt>
            <dd className="inline">{p.assigned_transitor || "Not assigned"}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-700">Shipment: </dt>
            <dd className="inline">
              {[p.mode_of_transport, p.shipment_type].filter(Boolean).join(" · ") ||
                "—"}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-700">Origin: </dt>
            <dd className="inline">
              {[p.port_of_loading, p.country_of_origin].filter(Boolean).join(", ") ||
                "—"}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-700">Destination: </dt>
            <dd className="inline">
              {[p.port_of_discharge, p.final_destination].filter(Boolean).join(", ") ||
                "—"}
            </dd>
          </div>
        </dl>
        {bl && (
          <div className="mt-2 border-t pt-2 text-slate-600">
            <span className="font-medium text-slate-700">BL {bl.bl_number}</span>
            {bl.bl_date ? ` · ${bl.bl_date}` : ""}
            {bl.shipping_company_name ? ` · ${bl.shipping_company_name}` : ""}
            {bl.vessel_name ? ` · ${bl.vessel_name}` : ""}
            {typeof bl.container_count === "number"
              ? ` · ${bl.container_count} container(s)`
              : ""}
          </div>
        )}
      </div>

      {(p.items ?? []).length > 0 && (
        <div className="overflow-hidden rounded-md border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 border-b">
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(p.items ?? []).map((item, index) => (
                <tr key={item.item_id ?? index} className="border-t">
                  <td className="px-3 py-2">{item.item_name || "—"}</td>
                  <td className="px-3 py-2 text-right">{item.quantity ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {typeof item.total_price === "number"
                      ? item.total_price.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-sm text-slate-600">
        <span className="font-medium text-slate-700">Letters generated: </span>
        {(p.transit_documents ?? []).length > 0
          ? (p.transit_documents ?? [])
              .map((d) => `${d.reference_number}`)
              .join(", ")
          : "None yet"}
      </div>
    </div>
  );
}

export default function TransitAdvancesPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const [rows, setRows] = useState<TransitAdvanceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<TransitAdvanceDetail | null>(null);
  const [rejecting, setRejecting] = useState<TransitAdvanceDetail | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");

  useEffect(() => {
    if (auth && !auth.isAdmin) router.replace("/");
  }, [auth, router]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${TRANSIT_ADVANCES_URL}?status=all`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to load advances",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      setRows(Array.isArray(data) ? (data as TransitAdvanceDetail[]) : []);
    } catch {
      showToast({
        title: "Failed to load advances",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = useMemo(
    () => rows.filter((row) => row.advance.status === "pending"),
    [rows],
  );
  const reviewed = useMemo(
    () => rows.filter((row) => row.advance.status !== "pending"),
    [rows],
  );

  const approve = async (row: TransitAdvanceDetail) => {
    setActionId(row.advance.id);
    try {
      const res = await fetch(TRANSIT_ADVANCE_APPROVE_URL(row.advance.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to approve",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      const detail = data as TransitAdvanceDetail;
      showToast({
        title: "Advance approved",
        description: `${detail.advance.purchase_number} · ${advanceMoney(
          detail.advance.amount,
          detail.advance.currency,
        )}`,
        variant: "success",
      });
      // Show the advance + purchase detail to the admin right after approving.
      setViewing(detail);
      await load();
    } catch {
      showToast({
        title: "Failed to approve",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setActionId(null);
    }
  };

  const reject = async () => {
    if (!rejecting) return;
    setActionId(rejecting.advance.id);
    try {
      const res = await fetch(TRANSIT_ADVANCE_REJECT_URL(rejecting.advance.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ remark: rejectRemark.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to reject",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      const detail = data as TransitAdvanceDetail;
      showToast({
        title: "Advance rejected",
        description: detail.advance.purchase_number,
        variant: "warning",
      });
      setRejecting(null);
      setRejectRemark("");
      setViewing(detail);
      await load();
    } catch {
      showToast({
        title: "Failed to reject",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  const renderRow = (row: TransitAdvanceDetail, showActions: boolean) => {
    const { advance, purchase } = row;
    return (
      <tr key={advance.id} className="border-t hover:bg-muted/30">
        <td className="px-4 py-2 font-medium">{advance.purchase_number}</td>
        <td className="px-4 py-2">
          {advanceMoney(advance.amount, advance.currency)}
        </td>
        <td className="px-4 py-2">{purchase.assigned_transitor || "—"}</td>
        <td className="px-4 py-2 text-muted-foreground">
          {advance.requested_by || "—"}
          {advance.requested_at ? ` · ${formatAdvanceDate(advance.requested_at)}` : ""}
        </td>
        <td className="px-4 py-2">
          <span className={transitAdvanceStatusClass(advance.status)}>
            {transitAdvanceStatusLabel(advance.status, advance.status_label)}
          </span>
          {advance.review_remark ? (
            <span className="mt-1 block text-xs text-muted-foreground">
              {advance.review_remark}
            </span>
          ) : null}
        </td>
        <td className="px-4 py-2 text-right">
          <div className="inline-flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewing(row)}
              className="gap-1"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
            {showActions && (
              <>
                <Button
                  size="sm"
                  disabled={actionId === advance.id}
                  onClick={() => approve(row)}
                  className="gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {actionId === advance.id ? "Working…" : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={actionId === advance.id}
                  onClick={() => {
                    setRejectRemark("");
                    setRejecting(row);
                  }}
                  className="gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <div className="flex items-center gap-2">
        <Banknote className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Transit Advance Approval</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Transitors request an advance for each transit. Letters of guarantee stay
        locked for the transitor until the advance is approved here. Approving
        shows the advance together with the full purchase detail.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending advance requests.
          </p>
        ) : (
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="px-4 py-2 text-left">Purchase</th>
                  <th className="px-4 py-2 text-left">Advance</th>
                  <th className="px-4 py-2 text-left">Transitor</th>
                  <th className="px-4 py-2 text-left">Requested By</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>{pending.map((row) => renderRow(row, true))}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Recently Reviewed ({reviewed.length})
        </h2>
        {reviewed.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing reviewed yet.</p>
        ) : (
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="px-4 py-2 text-left">Purchase</th>
                  <th className="px-4 py-2 text-left">Advance</th>
                  <th className="px-4 py-2 text-left">Transitor</th>
                  <th className="px-4 py-2 text-left">Requested By</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>{reviewed.map((row) => renderRow(row, false))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Advance + purchase detail — shown on View and right after approval. */}
      <Dialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Advance Detail{viewing ? ` · ${viewing.advance.purchase_number}` : ""}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <AdvanceSummary advance={viewing.advance} />
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  Purchase Detail
                </h3>
                <PurchaseSummary detail={viewing} />
              </div>
              <Link
                href={`/diredawa/purchase/${encodeURIComponent(
                  viewing.advance.purchase_number,
                )}`}
                target="_blank"
                className="inline-block text-sm font-medium text-blue-600 underline"
              >
                Open full purchase
              </Link>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject with remark */}
      <Dialog
        open={rejecting !== null}
        onOpenChange={(open) => {
          if (!open) setRejecting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Advance</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Reject the advance for{" "}
            <strong>{rejecting?.advance.purchase_number}</strong> (
            {advanceMoney(
              rejecting?.advance.amount,
              rejecting?.advance.currency,
            )}
            )? The transitor can revise and resubmit it.
          </p>
          <div className="space-y-1.5">
            <label htmlFor="reject-remark" className="text-sm font-medium">
              Remark (optional)
            </label>
            <Input
              id="reject-remark"
              value={rejectRemark}
              onChange={(e) => setRejectRemark(e.target.value)}
              placeholder="e.g. amount too high"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejecting(null)}
              disabled={actionId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={reject}
              disabled={actionId !== null}
            >
              {actionId !== null ? "Working…" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
