"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Pencil, Trash2 } from "lucide-react";

interface Purchase {
  id: string;
  purchase_number: string;
  status: string;
}

const PURCHASES_API_URL = "/api/purchases";

export default function PurchaseApprovalsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    if (auth && !auth.isAdmin) {
      router.replace("/");
    }
  }, [auth, router]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingPurchaseNumber, setApprovingPurchaseNumber] = useState<
    string | null
  >(null);
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
        const data: unknown = await res.json();
        if (!res.ok) {
          const detail = (data as { detail?: string | unknown })?.detail;
          const message =
            Array.isArray(detail)
              ? (detail as { msg?: string }[])
                  .map((d) => d.msg ?? JSON.stringify(d))
                  .join(", ")
              : typeof detail === "string"
                ? detail
                : (data as { message?: string })?.message;
          showToast({
            title: "Failed to load purchases",
            description: (message as string) || "Please try again.",
            variant: "error",
          });
          return;
        }
        const list = (data as Purchase[]).filter(
          (p) => (p as Purchase).status === "pending"
        );
        setPurchases(
          list.map((p) => ({
            id: (p as Purchase).id,
            purchase_number: (p as Purchase).purchase_number,
            status: (p as Purchase).status,
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

  const handleApprove = async (purchaseNumber: string) => {
    if (!auth?.userId) {
      showToast({
        title: "Login required",
        description: "Your account could not be loaded. Please refresh the page or log in again.",
        variant: "error",
      });
      return;
    }
    try {
      setApprovingPurchaseNumber(purchaseNumber);
      const res = await fetch(`/api/purchases/${encodeURIComponent(purchaseNumber)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by_id: auth.userId }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const detail = (data as { detail?: string | unknown })?.detail;
        const message =
          Array.isArray(detail)
            ? (detail as { msg?: string }[])
                .map((d) => d.msg ?? JSON.stringify(d))
                .join(", ")
            : typeof detail === "string"
              ? detail
              : (data as { message?: string })?.message;
        showToast({
          title: "Failed to approve purchase",
          description: (message as string) || "Please try again.",
          variant: "error",
        });
        return;
      }
      setPurchases((prev) =>
        prev.filter((p) => p.purchase_number !== purchaseNumber)
      );
      showToast({
        title: "Purchase approved",
        description: `Purchase ${(data as Purchase).purchase_number} has been approved.`,
        variant: "success",
      });
    } catch {
      showToast({
        title: "Failed to approve purchase",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setApprovingPurchaseNumber(null);
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
        const detail = (data as { detail?: string })?.detail;
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
        <h1 className="text-2xl font-bold">Purchase Approvals</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Approved By:</label>
          <input
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
              <th className="px-4 py-2 text-left">Select</th>
              <th className="px-4 py-2 text-left">Purchase Number</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-sm">
                  Loading pending purchases...
                </td>
              </tr>
            ) : purchases.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-sm">
                  No pending purchases for approval.
                </td>
              </tr>
            ) : (
              purchases.map((purchase) => (
                <tr key={purchase.id} className="border-t">
                  <td className="px-4 py-2">
                    <input type="checkbox" />
                  </td>
                  <td className="px-4 py-2">{purchase.purchase_number}</td>
                  <td className="px-4 py-2 capitalize">{purchase.status}</td>
                  <td className="px-4 py-2 flex gap-2 items-center">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(purchase.purchase_number)}
                      disabled={
                        approvingPurchaseNumber === purchase.purchase_number
                      }
                    >
                      {approvingPurchaseNumber === purchase.purchase_number
                        ? "Approving..."
                        : "Approve"}
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
