"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Pencil, Trash2 } from "lucide-react";
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
  buyer: string;
  proforma_ref_no: string;
  status: string;
  /** Sum of line totals (same as summed item total_price); from API */
  before_vat?: number;
  items: PurchaseItem[];
}

const PURCHASES_API_URL = "/api/purchases";

export default function DisplayPurchasesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const auth = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredPurchases = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return purchases;
    return purchases.filter(
      (p) =>
        p.purchase_number.toLowerCase().includes(q) ||
        p.buyer.toLowerCase().includes(q) ||
        (p.proforma_ref_no?.toLowerCase().includes(q)) ||
        p.status.toLowerCase().includes(q) ||
        p.items.some((i) => i.item_name.toLowerCase().includes(q))
    );
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

      setPurchases(data as Purchase[]);
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
  }, [showToast]);

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

      {loading ? (
        <p>Loading purchases...</p>
      ) : purchases.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No purchases found.
        </p>
      ) : (
        <>
          <div className="flex justify-end mb-4">
          <TableSearch value={search} onChange={setSearch} placeholder="Search purchases, vendor, items..." />
        </div>
          <div className="border rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-left px-4 py-2">Purchase Number</th>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-right px-4 py-2">Before VAT</th>
                <th className="text-left px-4 py-2">Vendor Name</th>
                <th className="text-left px-4 py-2">Status</th>
                {auth?.isAdmin && (
                  <th className="text-right px-4 py-2">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {pagedPurchases.map((purchase) => {
                const beforeVat =
                  purchase.before_vat ??
                  purchase.items.reduce(
                    (sum, item) => sum + item.total_price,
                    0
                  );
                return (
                  <tr key={purchase.id} className="border-t">
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={() =>
                          router.push(
                            `/diredawa/purchase/${purchase.purchase_number}`
                          )
                        }
                      >
                        {purchase.purchase_number}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(purchase.order_date).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {beforeVat.toLocaleString(undefined, {
                        maximumFractionDigits: 1,
                      })}
                    </td>
                    <td className="px-4 py-2">{purchase.buyer}</td>
                    <td className="px-4 py-2 capitalize">{purchase.status}</td>
                    {auth?.isAdmin && (
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/diredawa/purchase/${purchase.purchase_number}/edit`
                              )
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

