"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/authProvider";

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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
