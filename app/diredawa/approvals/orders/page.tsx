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

interface Order {
  id: string;
  order_number: string;
  status: string;
}

interface ApproveResponse extends Order {}

const ORDERS_API_URL = "/api/orders";

export default function OrderApprovalsPage() {
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
  const [approvingOrderNumber, setApprovingOrderNumber] = useState<
    string | null
  >(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [orderToRemove, setOrderToRemove] = useState<Order | null>(null);
  const [removing, setRemoving] = useState(false);

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
        const pending = (data as any[]).filter(
          (o) => (o as any).status === "pending"
        );
        setOrders(
          pending.map((o) => ({
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

  const handleApprove = async (orderNumber: string) => {
    if (!auth?.userId) {
      showToast({
        title: "Login required",
        description: "Your account could not be loaded. Please refresh the page or log in again.",
        variant: "error",
      });
      return;
    }
    try {
      setApprovingOrderNumber(orderNumber);
      const res = await fetch(`/api/orders/${orderNumber}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_number: orderNumber,
          approved_by_id: auth.userId,
        }),
      });
      const data: ApproveResponse = await res.json();
      if (!res.ok) {
        const detail = (data as any)?.detail;
        const message =
          Array.isArray(detail)
            ? detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(", ")
            : typeof detail === "string"
            ? detail
            : (data as any)?.message;
        showToast({
          title: "Failed to approve order",
          description: message || "Please try again.",
          variant: "error",
        });
        return;
      }
      setOrders((prev) =>
        prev.filter((o) => o.order_number !== orderNumber)
      );
      showToast({
        title: "Order approved",
        description: `Order ${data.order_number} has been approved.`,
        variant: "success",
      });
    } catch {
      showToast({
        title: "Failed to approve order",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setApprovingOrderNumber(null);
    }
  };

  const openRemove = (order: Order) => {
    setOrderToRemove(order);
    setRemoveOpen(true);
  };

  const handleRemove = async () => {
    if (!orderToRemove) return;
    setRemoving(true);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(orderToRemove.order_number)}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) {
        const detail = (data as any)?.detail;
        showToast({
          title: "Failed to remove order",
          description: detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      setOrders((prev) =>
        prev.filter((o) => o.order_number !== orderToRemove.order_number)
      );
      showToast({
        title: "Order removed",
        description: `Order ${orderToRemove.order_number} has been removed.`,
        variant: "success",
      });
      setRemoveOpen(false);
      setOrderToRemove(null);
    } catch {
      showToast({
        title: "Failed to remove order",
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
        <h1 className="text-2xl font-bold">Order Approvals</h1>
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
              <th className="px-4 py-2 text-left">Order ID</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-sm">
                  Loading pending orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-sm">
                  No pending orders for approval.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-2">
                    <input type="checkbox" />
                  </td>
                  <td className="px-4 py-2">{order.order_number}</td>
                  <td className="px-4 py-2 capitalize">{order.status}</td>
                  <td className="px-4 py-2 flex gap-2 items-center">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(order.order_number)}
                      disabled={approvingOrderNumber === order.order_number}
                    >
                      {approvingOrderNumber === order.order_number
                        ? "Approving..."
                        : "Approve"}
                    </Button>
                    <Link href={`/diredawa/orders/${order.order_number}/edit`}>
                      <Button size="sm" variant="outline" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openRemove(order)}
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
            <DialogTitle>Remove Order</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove order{" "}
            <strong>{orderToRemove?.order_number}</strong>? This action cannot
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

