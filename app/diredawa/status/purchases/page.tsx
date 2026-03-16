"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/authProvider";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";

interface Purchase {
  id: string;
  purchase_number: string;
  status: string;
}

const PURCHASES_API_URL = "/api/purchases";

export default function PurchaseStatusPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    if (auth && !auth.isAdmin) {
      router.replace("/");
    }
  }, [auth, router]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPurchaseNumber, setPopupPurchaseNumber] = useState<string | null>(null);
  const [popupAction, setPopupAction] = useState<"completed" | "cancelled">("completed");
  const [remarking, setRemarking] = useState(false);
  const [remark, setRemark] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);
  const [purchaseToRemove, setPurchaseToRemove] = useState<Purchase | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch(PURCHASES_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) {
          const detail = (data as any)?.detail;
          const message =
            Array.isArray(detail)
              ? detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(", ")
              : typeof detail === "string"
              ? detail
              : (data as any)?.message;
          showToast({
            title: "Failed to load purchases",
            description: message || "Please try again.",
            variant: "error",
          });
          return;
        }
        const approved = (data as any[]).filter(
          (p) => (p as any).status === "approved"
        );
        setPurchases(
          approved.map((p) => ({
            id: p.id,
            purchase_number: p.purchase_number,
            status: p.status,
          }))
        );
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

    fetchPurchases();
  }, [showToast]);

  const openRemarkPopup = (
    purchaseNumber: string,
    action: "completed" | "cancelled"
  ) => {
    if (!auth?.userId) {
      showToast({
        title: "Login required",
        description: "Your account could not be loaded. Please refresh the page or log in again.",
        variant: "error",
      });
      return;
    }
    setPopupPurchaseNumber(purchaseNumber);
    setPopupAction(action);
    setRemark("");
    setPopupOpen(true);
  };

  const handleSubmitRemark = async () => {
    if (!popupPurchaseNumber) return;
    try {
      setRemarking(true);
      const res = await fetch(
        `/api/purchases/${encodeURIComponent(popupPurchaseNumber)}/update-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: popupAction,
            user_id: auth?.userId ?? null,
            remark: remark || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        const detail = (data as any)?.detail;
        showToast({
          title: "Failed to update status",
          description: detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      setPurchases((prev) =>
        prev.filter((p) => p.purchase_number !== popupPurchaseNumber)
      );
      showToast({
        title: `Purchase ${popupAction}`,
        description: `Purchase ${popupPurchaseNumber} has been marked as ${popupAction}.`,
        variant: "success",
      });
      setPopupOpen(false);
      setPopupPurchaseNumber(null);
    } catch {
      showToast({
        title: "Failed to update status",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setRemarking(false);
    }
  };

  const openRemove = (purchase: Purchase) => {
    setPurchaseToRemove(purchase);
    setRemoveOpen(true);
  };

  const handleRemove = async () => {
    if (!purchaseToRemove) return;
    setRemoving(true);
    try {
      const res = await fetch(
        `/api/purchases/${encodeURIComponent(purchaseToRemove.purchase_number)}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) {
        const detail = (data as any)?.detail;
        showToast({
          title: "Failed to remove purchase",
          description: detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      setPurchases((prev) =>
        prev.filter((p) => p.purchase_number !== purchaseToRemove.purchase_number)
      );
      showToast({
        title: "Purchase removed",
        description: `Purchase ${purchaseToRemove.purchase_number} has been removed.`,
        variant: "success",
      });
      setRemoveOpen(false);
      setPurchaseToRemove(null);
    } catch {
      showToast({
        title: "Failed to remove purchase",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Update Purchase Status</h1>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Approved By:</Label>
          <Input
            value={auth?.username ?? ""}
            disabled
            readOnly
            className="border rounded-md px-3 py-1.5 text-sm w-48 bg-muted"
          />
        </div>
      </div>

      <div className="border rounded-md overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-2 text-left">No.</th>
              <th className="px-4 py-2 text-left">Select</th>
              <th className="px-4 py-2 text-left">Purchase ID</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm">
                  Loading approved purchases...
                </td>
              </tr>
            ) : purchases.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm">
                  No approved purchases.
                </td>
              </tr>
            ) : (
              purchases.map((purchase, idx) => (
                <tr key={purchase.id} className="border-t">
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <input type="checkbox" />
                  </td>
                  <td className="px-4 py-2">{purchase.purchase_number}</td>
                  <td className="px-4 py-2 capitalize">{purchase.status}</td>
                  <td className="px-4 py-2 flex gap-2 items-center">
                    <Button
                      size="sm"
                      style={{ backgroundColor: "#16a34a", color: "white" }}
                      className="hover:opacity-90"
                      onClick={() => openRemarkPopup(purchase.purchase_number, "completed")}
                    >
                      Completed
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        openRemarkPopup(purchase.purchase_number, "cancelled")
                      }
                    >
                      Cancelled
                    </Button>
                    <Link href={`/diredawa/purchase/${purchase.purchase_number}/edit`}>
                      <Button size="sm" variant="outline" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openRemove(purchase)}
                      title="Remove"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {popupAction === "completed" ? "Mark as Completed" : "Mark as Cancelled"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="remark">Remark</Label>
              <Input
                id="remark"
                placeholder="Remark (optional)"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPopupOpen(false)}
              disabled={remarking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRemark}
              disabled={remarking}
              style={
                popupAction === "completed"
                  ? { backgroundColor: "#16a34a", color: "white" }
                  : undefined
              }
              className={popupAction === "completed" ? "hover:opacity-90" : ""}
            >
              {remarking ? "Updating..." : popupAction === "completed" ? "Complete" : "Cancel Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Purchase</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove purchase{" "}
            <strong>{purchaseToRemove?.purchase_number}</strong>? This action cannot
            be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRemoveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
