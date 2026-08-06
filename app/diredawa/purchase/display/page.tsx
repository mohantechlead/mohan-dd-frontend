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
import { Pencil, ShieldAlert, Trash2, X } from "lucide-react";
import { TableSearch } from "@/components/table-search";

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
  before_vat?: number;
  items: PurchaseItem[];
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
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    if (!q) return purchases;
    return purchases.filter((p) => {
      const items = Array.isArray(p.items) ? p.items : [];
      return (
        (p.purchase_number ?? "").toLowerCase().includes(q) ||
        (p.shipper ?? p.buyer ?? "").toLowerCase().includes(q) ||
        (p.proforma_ref_no ?? "").toLowerCase().includes(q) ||
        (p.status ?? "").toLowerCase().includes(q) ||
        items.some((i) => (i?.item_name ?? "").toLowerCase().includes(q))
      );
    });
  }, [purchases, search]);

  useEffect(() => {
    setPageIndex(0);
  }, [search]);

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

  const showBanner = !bannerDismissed && missingMarineInsurance.length > 0;

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
          <div className="flex justify-end mb-4">
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
                  {canManageRecords && (
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
                      {canManageRecords && (
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-2">
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
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
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
