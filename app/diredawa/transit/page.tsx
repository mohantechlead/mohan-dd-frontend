"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/authProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TableSearch } from "@/components/table-search";
import {
  StagePill,
  StageStepper,
  nextTransitorStage,
  stageLabel,
} from "@/components/stage-display";

interface TransitPurchase {
  id: string;
  purchase_number: string;
  order_date: string;
  buyer?: string | null;
  shipper?: string | null;
  proforma_ref_no?: string | null;
  status?: string | null;
  stage?: string | null;
  stage_updated_at?: string | null;
  stage_updated_by?: string | null;
  assigned_transitor?: string | null;
  items?: Array<{ item_name?: string; total_price?: number }>;
}

export default function TransitPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const auth = useAuth();
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<TransitPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmRow, setConfirmRow] = useState<TransitPurchase | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && auth && !auth.isTransitor && !auth.isAdmin) {
      router.replace("/");
    }
  }, [mounted, auth, router]);

  const fetchRows = async () => {
    try {
      const res = await fetch("/api/purchases/my-transits", {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to load purchases",
          description:
            (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      setRows(Array.isArray(data) ? (data as TransitPurchase[]) : []);
    } catch {
      showToast({
        title: "Failed to load purchases",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.purchase_number ?? "").toLowerCase().includes(q) ||
      (r.shipper ?? r.buyer ?? "").toLowerCase().includes(q) ||
      (r.proforma_ref_no ?? "").toLowerCase().includes(q) ||
      stageLabel(r.stage).toLowerCase().includes(q)
    );
  }, [rows, search]);

  const confirmRowNextStage = confirmRow ? nextTransitorStage(confirmRow.stage) : null;

  const handleAdvance = async () => {
    if (!confirmRow || !confirmRowNextStage) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/purchases/${encodeURIComponent(confirmRow.purchase_number)}/stage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            stage: confirmRowNextStage,
            user_id: auth?.userId,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to update checkpoint",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({
        title: `Checkpoint updated to ${stageLabel(confirmRowNextStage)}`,
        variant: "success",
      });
      setConfirmRow(null);
      await fetchRows();
    } catch {
      showToast({
        title: "Failed to update checkpoint",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (auth && !auth.isTransitor && !auth.isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">My Checkpoints</h1>
        </div>
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search purchase, supplier..."
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading purchases…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white px-6 py-12 text-center">
          <Truck className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-medium text-slate-600">
            No purchase orders assigned to you yet.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            When a sales person assigns you to an order, it will appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No purchases match your search.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((row) => {
            const next = nextTransitorStage(row.stage);
            const stage = (row.stage ?? "").trim();
            const isTerminal = stage === "closed" || stage === "cancelled";
            const atTransitPermit = stage === "transit_permit";
            return (
              <div
                key={row.id}
                className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-blue-600">
                      {row.purchase_number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {row.shipper?.trim() || row.buyer || "—"}
                    </div>
                  </div>
                  <StagePill stage={row.stage} />
                </div>

                <div className="text-xs text-muted-foreground">
                  {row.order_date
                    ? new Date(row.order_date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                  {row.proforma_ref_no ? ` · Proforma: ${row.proforma_ref_no}` : ""}
                </div>

                <StageStepper stage={row.stage} />

                <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    {row.stage_updated_at
                      ? `Updated ${new Date(row.stage_updated_at).toLocaleDateString()}${
                          row.stage_updated_by ? ` by ${row.stage_updated_by}` : ""
                        }`
                      : "Not started"}
                  </span>
                  {next ? (
                    <Button
                      size="sm"
                      onClick={() => setConfirmRow(row)}
                      className="gap-1"
                    >
                      Advance to {stageLabel(next)}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : isTerminal ? (
                    <span className="text-xs font-medium text-slate-500">
                      {stage === "closed" ? "Completed" : "Cancelled"}
                    </span>
                  ) : atTransitPermit ? (
                    <span className="text-xs text-muted-foreground">
                      Waiting for sales/admin to close
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={confirmRow !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmRow(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advance Checkpoint</DialogTitle>
          </DialogHeader>
          <p>
            Move purchase <strong>{confirmRow?.purchase_number}</strong> to{" "}
            <strong>{confirmRowNextStage ? stageLabel(confirmRowNextStage) : ""}</strong>?
          </p>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmRow(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAdvance} disabled={submitting}>
              {submitting ? "Updating…" : "Advance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
