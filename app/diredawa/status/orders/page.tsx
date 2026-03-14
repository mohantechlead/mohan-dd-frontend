"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

interface Order {
  id: string;
  order_number: string;
  status: string;
}

const ORDERS_API_URL = "/api/orders";

export default function OrderStatusPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    if (auth && !auth.isAdmin) {
      router.replace("/");
    }
  }, [auth, router]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Popup state for Completed/Cancelled
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupOrderNumber, setPopupOrderNumber] = useState<string | null>(null);
  const [popupAction, setPopupAction] = useState<"completed" | "cancelled">(
    "completed"
  );
  const [remarking, setRemarking] = useState(false);
  const [remark, setRemark] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(ORDERS_API_URL, {
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
            title: "Failed to load orders",
            description: message || "Please try again.",
            variant: "error",
          });
          return;
        }
        const approved = (data as any[]).filter(
          (o) => (o as any).status === "approved"
        );
        setOrders(
          approved.map((o) => ({
            id: o.id,
            order_number: o.order_number,
            status: o.status,
          }))
        );
      } catch {
        showToast({
          title: "Failed to load orders",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [showToast]);

  const openRemarkPopup = (
    orderNumber: string,
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
    setPopupOrderNumber(orderNumber);
    setPopupAction(action);
    setRemark("");
    setPopupOpen(true);
  };

  const handleSubmitRemark = async () => {
    if (!popupOrderNumber) return;
    try {
      setRemarking(true);
      const res = await fetch(
        `/api/orders/${encodeURIComponent(popupOrderNumber)}/update-status`,
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
      setOrders((prev) =>
        prev.filter((o) => o.order_number !== popupOrderNumber)
      );
      showToast({
        title: `Order ${popupAction}`,
        description: `Order ${popupOrderNumber} has been marked as ${popupAction}.`,
        variant: "success",
      });
      setPopupOpen(false);
      setPopupOrderNumber(null);
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

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Update Order Status</h1>
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
              <th className="px-4 py-2 text-left">Order ID</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm">
                  Loading approved orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm">
                  No approved orders.
                </td>
              </tr>
            ) : (
              orders.map((order, idx) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <input type="checkbox" />
                  </td>
                  <td className="px-4 py-2">{order.order_number}</td>
                  <td className="px-4 py-2 capitalize">{order.status}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <Button
                      size="sm"
                      style={{ backgroundColor: "#16a34a", color: "white" }}
                      className="hover:opacity-90"
                      onClick={() => openRemarkPopup(order.order_number, "completed")}
                    >
                      Completed
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        openRemarkPopup(order.order_number, "cancelled")
                      }
                    >
                      Cancelled
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
              {remarking ? "Updating..." : popupAction === "completed" ? "Complete" : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
