"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Printer, Truck } from "lucide-react";
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
import {
  TRANSIT_DOCUMENTS_FOR_STAGE,
  TransitDocument,
  formatOrdinalDate,
  guaranteePrintUrl,
  transitDocumentLabel,
} from "@/lib/transit-documents";

interface TransitContainer {
  container_number?: string;
  size?: string;
  cargo_type?: string;
}

interface TransitBl {
  bl_number: string;
  bl_date: string;
  container_count: number;
  shipping_company_name?: string | null;
  vessel_name?: string | null;
  transit_status: string;
  transit_status_label?: string | null;
  containers?: TransitContainer[];
}

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
  bill_of_lading?: TransitBl | null;
  transit_documents?: TransitDocument[];
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
    const letterTypes = TRANSIT_DOCUMENTS_FOR_STAGE[confirmRowNextStage] ?? [];
    // Open the print tab while we are still inside the click gesture, then
    // point it at the letters once the backend has generated them.
    const printWindow =
      letterTypes.length > 0 ? window.open("", "_blank") : null;

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
        printWindow?.close();
        showToast({
          title: "Failed to update checkpoint",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      const printUrl =
        letterTypes.length > 0
          ? guaranteePrintUrl(confirmRow.purchase_number, letterTypes, true)
          : null;
      if (printUrl) {
        if (printWindow) {
          printWindow.location.href = printUrl;
        } else {
          window.open(printUrl, "_blank");
        }
      }
      showToast({
        title: `Checkpoint updated to ${stageLabel(confirmRowNextStage)}`,
        description:
          letterTypes.length > 0
            ? `${letterTypes.map(transitDocumentLabel).join(" and ")} ready to print.`
            : undefined,
        variant: "success",
      });
      setConfirmRow(null);
      await fetchRows();
    } catch {
      printWindow?.close();
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
            const isTerminal = stage === "done" || stage === "cancelled";
            const atClosureGuarantee = stage === "closure_guarantee";
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

                {row.bill_of_lading && (
                  <div className="space-y-1 rounded-md border bg-slate-50 px-3 py-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">
                        BL {row.bill_of_lading.bl_number}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                        {row.bill_of_lading.transit_status_label ||
                          row.bill_of_lading.transit_status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
                      <span>
                        Date:{" "}
                        {formatOrdinalDate(row.bill_of_lading.bl_date)}
                      </span>
                      <span>
                        Containers: {row.bill_of_lading.container_count}
                      </span>
                      <span>
                        Shipping:{" "}
                        {row.bill_of_lading.shipping_company_name || "—"}
                      </span>
                      <span>
                        Vessel: {row.bill_of_lading.vessel_name || "—"}
                      </span>
                    </div>
                    {(row.bill_of_lading.containers ?? []).length > 0 && (
                      <p className="break-words text-slate-600">
                        Container No.:{" "}
                        {(row.bill_of_lading.containers ?? [])
                          .map(
                            (container) =>
                              `${container.container_number ?? "—"}${
                                container.size ? ` (${container.size}ft)` : ""
                              }`
                          )
                          .join(", ")}
                      </p>
                    )}
                  </div>
                )}

                {(row.transit_documents ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(row.transit_documents ?? []).map((document) => (
                      <Link
                        key={document.id}
                        href={guaranteePrintUrl(
                          row.purchase_number,
                          [document.document_type],
                          false
                        )}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Printer className="h-3 w-3" />
                        {transitDocumentLabel(document.document_type)}
                        <span className="text-slate-400">
                          {document.reference_number}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

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
                      {stage === "done" ? "Done" : "Cancelled"}
                    </span>
                  ) : atClosureGuarantee ? (
                    <span className="text-xs text-muted-foreground">
                      Waiting for sales/admin to mark done
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
