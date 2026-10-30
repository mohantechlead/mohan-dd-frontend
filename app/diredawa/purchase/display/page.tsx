"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/authProvider";
import { TablePagination, slicePage } from "@/components/table-pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, ShieldAlert, Trash2, UserCog, X, Download } from "lucide-react";
import { TableSearch } from "@/components/table-search";
import {
  STAGE_OPTIONS,
  StagePill,
  stageLabel,
} from "@/components/stage-display";

interface PurchaseItem {
  purchase_number: string;
  item_name: string;
  price: number;
  quantity: number;
  remaining: number;
  total_price: number;
  before_vat?: number;
  hscode?: string | null;
  measurement: string;
}

interface Purchase {
  id: string;
  purchase_number: string;
  order_date: string;
  shipper?: string | null;
  buyer?: string | null;
  proforma_ref_no: string;
  status?: string | null;
  stage?: string | null;
  stage_updated_at?: string | null;
  stage_updated_by?: string | null;
  assigned_transitor_id?: number | null;
  assigned_transitor?: string | null;
  before_vat?: number;
  items: PurchaseItem[];
}

interface TransitorOption {
  id: number;
  username: string;
}

const PURCHASES_API_URL = "/api/purchases";
const BANNER_DISMISSED_KEY = "marine-insurance-banner-dismissed-date";

function isNearEndOfMonth(daysThreshold = 5): boolean {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return now.getDate() >= lastDay - daysThreshold + 1;
}

export default function DisplayPurchasesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const auth = useAuth();
  const canManageRecords = auth?.canManageRecords ?? false;
  const canManageCheckpoints = auth?.isAdmin === true || auth?.isSales === true;
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Checkpoint dialog (assign transitor / override stage)
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [checkpointPurchase, setCheckpointPurchase] = useState<Purchase | null>(null);
  const [transitors, setTransitors] = useState<TransitorOption[]>([]);
  const [transitorsLoading, setTransitorsLoading] = useState(false);
  const [selectedTransitor, setSelectedTransitor] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [savingCheckpoint, setSavingCheckpoint] = useState<"transitor" | "stage" | null>(null);

  // Marine insurance banner
  const [missingMarineInsurance, setMissingMarineInsurance] = useState<Purchase[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const nearEndOfMonth = isNearEndOfMonth(5);

  const dismissBanner = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(BANNER_DISMISSED_KEY, today);
    setBannerDismissed(true);
  };

  const checkMissingMarineInsurance = useCallback(async (approvedPurchases: Purchase[]) => {
    const dismissedDate = localStorage.getItem(BANNER_DISMISSED_KEY);
    const today = new Date().toISOString().slice(0, 10);
    if (dismissedDate === today) {
      setBannerDismissed(true);
      return;
    }
    if (approvedPurchases.length === 0) {
      setBannerDismissed(true);
      return;
    }
    try {
      const res = await fetch("/api/purchases/missing-marine-insurance", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const missing = Array.isArray(data) ? data : [];
        setMissingMarineInsurance(missing);
        setBannerDismissed(missing.length === 0);
        return;
      }
    } catch {
      // fall through to individual checks
    }
    const missing: Purchase[] = [];
    await Promise.all(
      approvedPurchases.map(async (p) => {
        try {
          const r = await fetch(
            `/api/purchases/${encodeURIComponent(p.purchase_number)}/marine-insurance`,
            { credentials: "include" }
          );
          if (r.status === 404) missing.push(p);
        } catch {
          missing.push(p);
        }
      })
    );
    setMissingMarineInsurance(missing);
    setBannerDismissed(missing.length === 0);
  }, []);

  const filteredPurchases = useMemo(() => {
    const q = search.toLowerCase().trim();
    return purchases.filter((p) => {
      const orderDate = (p.order_date ?? "").slice(0, 10);
      if (fromDate && orderDate && orderDate < fromDate) return false;
      if (toDate && orderDate && orderDate > toDate) return false;
      if (!q) return true;
      const items = Array.isArray(p.items) ? p.items : [];
      return (
        (p.purchase_number ?? "").toLowerCase().includes(q) ||
        (p.shipper ?? p.buyer ?? "").toLowerCase().includes(q) ||
        (p.proforma_ref_no ?? "").toLowerCase().includes(q) ||
        (p.status ?? "").toLowerCase().includes(q) ||
        stageLabel(p.stage).toLowerCase().includes(q) ||
        (p.assigned_transitor ?? "").toLowerCase().includes(q) ||
        items.some((i) => (i?.item_name ?? "").toLowerCase().includes(q))
      );
    });
  }, [purchases, search, fromDate, toDate]);

  useEffect(() => {
    setPageIndex(0);
  }, [search, fromDate, toDate]);

  const pagedPurchases = useMemo(
    () => slicePage(filteredPurchases, pageIndex, pageSize),
    [filteredPurchases, pageIndex, pageSize]
  );

  const fetchPurchases = async () => {
    try {
      const res = await fetch(PURCHASES_API_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        showToast({
          title: "Failed to load purchases",
          description:
            (data as { detail?: string; message?: string })?.detail ||
            (data as { detail?: string; message?: string })?.message ||
            "Please try again.",
          variant: "error",
        });
        return;
      }

      const extractPurchaseNumber = (value?: string) => {
        const matches = (value ?? "").match(/\d+/g);
        if (!matches || matches.length === 0) return -Infinity;
        const last = matches[matches.length - 1];
        const n = Number(last);
        return Number.isFinite(n) ? n : -Infinity;
      };

      const sorted = [...(data as Purchase[])].sort((a, b) => {
        const aNum = extractPurchaseNumber(a.purchase_number);
        const bNum = extractPurchaseNumber(b.purchase_number);
        if (bNum !== aNum) return bNum - aNum;
        return (b.purchase_number ?? "").localeCompare(a.purchase_number ?? "");
      });
      setPurchases(sorted);

      const approved = sorted.filter((p) => p.status === "approved");
      checkMissingMarineInsurance(approved);
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
    fetchPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDelete = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!purchaseToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${PURCHASES_API_URL}/${encodeURIComponent(purchaseToDelete.purchase_number)}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to delete purchase",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Purchase deleted", variant: "success" });
      setDeleteOpen(false);
      setPurchaseToDelete(null);
      fetchPurchases();
    } catch {
      showToast({
        title: "Failed to delete purchase",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const exportToExcel = async () => {
    if (filteredPurchases.length === 0) {
      showToast({
        title: "Nothing to export",
        description: "No purchase orders match the current filters.",
        variant: "error",
      });
      return;
    }
    const XLSX = await import("xlsx");
    const rows = filteredPurchases.map((purchase) => {
      const beforeVat =
        purchase.before_vat ??
        (Array.isArray(purchase.items)
          ? purchase.items.reduce((sum, item) => sum + Number(item.total_price || 0), 0)
          : 0);
      const itemsText = (purchase.items ?? [])
        .map((item) => {
          const measurement = item.measurement ? ` ${item.measurement}` : "";
          return `${item.item_name} (${item.quantity}${measurement})`;
        })
        .join("; ");
      return {
        "Purchase Number": purchase.purchase_number,
        Date: (purchase.order_date ?? "").slice(0, 10),
        Supplier: purchase.shipper ?? purchase.buyer ?? "",
        Buyer: purchase.buyer ?? "",
        "Proforma Ref. No.": purchase.proforma_ref_no ?? "",
        "Before VAT": beforeVat,
        Status: purchase.status ?? "pending",
        Checkpoint: stageLabel(purchase.stage),
        "Assigned Transitor": purchase.assigned_transitor ?? "",
        Items: itemsText,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 18 },
      { wch: 12 },
      { wch: 24 },
      { wch: 24 },
      { wch: 20 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 60 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Orders");
    const range =
      fromDate || toDate
        ? `${fromDate || "start"}_to_${toDate || "end"}`
        : new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `purchase_orders_${range}.xlsx`);
  };

  const showBanner = !bannerDismissed && missingMarineInsurance.length > 0;

  const fetchTransitors = async () => {
    setTransitorsLoading(true);
    try {
      const res = await fetch("/api/users/transitors", { credentials: "include" });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setTransitors(data as TransitorOption[]);
      }
    } catch {
      // leave list empty; dialog still usable
    } finally {
      setTransitorsLoading(false);
    }
  };

  const openCheckpoint = (purchase: Purchase) => {
    setCheckpointPurchase(purchase);
    setSelectedTransitor(
      purchase.assigned_transitor_id != null ? String(purchase.assigned_transitor_id) : ""
    );
    setSelectedStage((purchase.stage ?? "").trim());
    setCheckpointOpen(true);
    if (transitors.length === 0 && !transitorsLoading) fetchTransitors();
  };

  const postCheckpoint = async (
    path: "stage" | "assign-transitor",
    body: Record<string, unknown>,
    kind: "transitor" | "stage"
  ) => {
    if (!checkpointPurchase) return;
    setSavingCheckpoint(kind);
    try {
      const res = await fetch(
        `/api/purchases/${encodeURIComponent(checkpointPurchase.purchase_number)}/${path}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: kind === "transitor" ? "Failed to assign transitor" : "Failed to update checkpoint",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({
        title: kind === "transitor" ? "Transitor assigned" : "Checkpoint stage updated",
        variant: "success",
      });
      if (data && typeof data === "object" && "purchase_number" in data) {
        setCheckpointPurchase((prev) =>
          prev ? { ...prev, ...(data as Partial<Purchase>) } : prev
        );
      }
      fetchPurchases();
    } catch {
      showToast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "error",
      });
    } finally {
      setSavingCheckpoint(null);
    }
  };

  const saveTransitorAssignment = () => {
    postCheckpoint(
      "assign-transitor",
      {
        transitor_id: selectedTransitor ? Number(selectedTransitor) : null,
        user_id: auth?.userId ?? null,
      },
      "transitor"
    );
  };

  const saveStageOverride = () => {
    postCheckpoint(
      "stage",
      { stage: selectedStage || null, user_id: auth?.userId ?? null },
      "stage"
    );
  };

  return (
    <div className="max-w-5xl mx-auto mt-4 space-y-6">
      <div className="flex justify-between items-center">
        <Button onClick={() => router.push("/diredawa/purchase/create")}>
          Create Purchase
        </Button>
        <h1 className="text-2xl font-bold text-center flex-1">
          Purchase Orders
        </h1>
      </div>

      {/* Marine Insurance Missing Banner */}
      {showBanner && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">
              Marine insurance missing on {missingMarineInsurance.length} approved purchase{missingMarineInsurance.length > 1 ? "s" : ""}
              {nearEndOfMonth && " — end of month is approaching!"}
            </p>
            <p className="mt-0.5 text-amber-800">
              {missingMarineInsurance.slice(0, 5).map((p) => p.purchase_number).join(", ")}
              {missingMarineInsurance.length > 5 && ` +${missingMarineInsurance.length - 5} more`}
              {" — click a purchase number below to add the details."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={dismissBanner}
            className="flex-shrink-0 rounded p-0.5 hover:bg-amber-200 transition-colors"
          >
            <X className="h-4 w-4 text-amber-700" />
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading purchases...</p>
      ) : purchases.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No purchases found.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="purchase-from-date">
                  From date
                </label>
                <input
                  id="purchase-from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 rounded-md border px-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="purchase-to-date">
                  To date
                </label>
                <input
                  id="purchase-to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 rounded-md border px-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="h-9 rounded-md border px-3 text-sm font-medium"
              >
                Clear dates
              </button>
              <button
                type="button"
                onClick={exportToExcel}
                className="h-9 rounded-md border px-3 text-sm font-medium inline-flex items-center gap-1"
              >
                <Download className="h-4 w-4" /> Export to Excel
              </button>
            </div>
            <TableSearch value={search} onChange={setSearch} placeholder="Search purchases, supplier, items..." />
          </div>
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="text-left px-4 py-2">Purchase Number</th>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-right px-4 py-2">Before VAT</th>
                  <th className="text-left px-4 py-2">Supplier Name</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Checkpoint</th>
                  {(canManageRecords || canManageCheckpoints) && (
                    <th className="text-right px-4 py-2">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pagedPurchases.map((purchase) => {
                  const beforeVat =
                    purchase.before_vat ??
                    purchase.items.reduce((sum, item) => sum + item.total_price, 0);
                  const isMissingMarine = missingMarineInsurance.some(
                    (m) => m.purchase_number === purchase.purchase_number
                  );
                  return (
                    <tr key={purchase.id} className={`border-t ${isMissingMarine ? "bg-amber-50/60" : ""}`}>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          onClick={() =>
                            router.push(`/diredawa/purchase/${purchase.purchase_number}`)
                          }
                        >
                          {purchase.purchase_number}
                          {isMissingMarine && (
                            <span title="Marine insurance missing" className="inline-flex">
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        {new Date(purchase.order_date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {beforeVat.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </td>
                      <td className="px-4 py-2">
                        {purchase.shipper?.trim() || purchase.buyer || "—"}
                      </td>
                      <td className="px-4 py-2 capitalize">
                        {purchase.status?.trim() ? purchase.status : "pending"}
                      </td>
                      <td className="px-4 py-2">
                        <StagePill stage={purchase.stage} />
                        {purchase.assigned_transitor?.trim() && (
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            Transitor: {purchase.assigned_transitor}
                          </div>
                        )}
                      </td>
                      {(canManageRecords || canManageCheckpoints) && (
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            {canManageCheckpoints && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Checkpoint: assign transitor / update stage"
                                onClick={() => openCheckpoint(purchase)}
                              >
                                <UserCog className="w-4 h-4" />
                              </Button>
                            )}
                            {canManageRecords && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    router.push(`/diredawa/purchase/${purchase.purchase_number}/edit`)
                                  }
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDelete(purchase)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {pagedPurchases.length === 0 && (
                  <tr>
                    <td
                      colSpan={canManageRecords || canManageCheckpoints ? 7 : 6}
                      className="px-4 py-6 text-center text-sm text-muted-foreground"
                    >
                      No purchase orders match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border border-border border-t-0 rounded-b-md overflow-hidden bg-white">
            <TablePagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              totalItems={filteredPurchases.length}
              onPageIndexChange={setPageIndex}
              onPageSizeChange={(next) => {
                setPageSize(next);
                setPageIndex(0);
              }}
            />
          </div>
        </>
      )}

      <Dialog open={checkpointOpen} onOpenChange={setCheckpointOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Checkpoint — {checkpointPurchase?.purchase_number}
            </DialogTitle>
          </DialogHeader>

          {/* Assign transitor */}
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-semibold">Assign transitor</p>
            <p className="text-xs text-muted-foreground">
              Current:{" "}
              {checkpointPurchase?.assigned_transitor?.trim() ||
                "Not assigned"}
            </p>
            <select
              value={selectedTransitor}
              onChange={(e) => setSelectedTransitor(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1"
              disabled={transitorsLoading}
            >
              <option value="">
                {transitorsLoading
                  ? "Loading transitors..."
                  : "Not assigned"}
              </option>
              {transitors.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.username}
                </option>
              ))}
            </select>
            {!transitorsLoading && transitors.length === 0 && (
              <p className="text-xs text-amber-600">
                No transitor users found. Create a user with the “transitor”
                role first.
              </p>
            )}
            <Button
              size="sm"
              onClick={saveTransitorAssignment}
              disabled={savingCheckpoint !== null || transitorsLoading}
            >
              {savingCheckpoint === "transitor" ? "Assigning..." : "Assign"}
            </Button>
          </div>

          {/* Override stage */}
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-semibold">Checkpoint stage</p>
            <p className="text-xs text-muted-foreground">
              Current: <StagePill stage={checkpointPurchase?.stage} />
              {checkpointPurchase?.stage_updated_at && (
                <span className="ml-1">
                  · updated{" "}
                  {new Date(
                    checkpointPurchase.stage_updated_at
                  ).toLocaleDateString()}
                  {checkpointPurchase.stage_updated_by
                    ? ` by ${checkpointPurchase.stage_updated_by}`
                    : ""}
                </span>
              )}
            </p>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1"
            >
              <option value="">Not started</option>
              {STAGE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={saveStageOverride}
              disabled={savingCheckpoint !== null}
            >
              {savingCheckpoint === "stage" ? "Saving..." : "Save stage"}
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCheckpointOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Purchase</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete purchase &quot;{purchaseToDelete?.purchase_number}&quot;? This action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
