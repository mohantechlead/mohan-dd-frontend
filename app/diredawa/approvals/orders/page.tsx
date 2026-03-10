"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface Order {
  id: string;
  order_number: string;
  status: string;
}

interface ApproveResponse extends Order {}

const ORDERS_API_URL = "/api/orders";
const USERS_API_URL = "/api/users";

export default function OrderApprovalsPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [approvedById, setApprovedById] = useState<number | null>(null);
  const [approvedByName, setApprovedByName] = useState<string>("");
  const [approvingOrderNumber, setApprovingOrderNumber] = useState<
    string | null
  >(null);
  const [users, setUsers] = useState<{ id: number; username: string }[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

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
    const fetchUsers = async () => {
      try {
        const res = await fetch(USERS_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) return;
        setUsers(data as { id: number; username: string }[]);
      } catch {
        // ignore
      }
    };

    fetchOrders();
    fetchUsers();
  }, [showToast]);

  const handleApprove = async (orderNumber: string) => {
    if (!approvedById) {
      showToast({
        title: "Approved By required",
        description: "Please select who is approving before approving orders.",
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
          approved_by_id: approvedById,
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

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order Approvals</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Approved By:</label>
          <div className="relative">
            <input
              value={approvedByName}
              onChange={(e) => {
                setApprovedByName(e.target.value);
                setUserQuery(e.target.value);
                setShowUserDropdown(true);
              }}
              placeholder="Search user"
              className="border rounded-md px-3 py-1.5 text-sm"
              autoComplete="off"
              onFocus={() => setShowUserDropdown(true)}
            />
            {showUserDropdown && users.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-md border shadow-lg bg-white">
                {users
                  .filter((u) =>
                    u.username.toLowerCase().includes(userQuery.toLowerCase())
                  )
                  .slice(0, 20)
                  .map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      className="block w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                      onClick={() => {
                        setApprovedById(u.id);
                        setApprovedByName(u.username);
                        setUserQuery(u.username);
                        setShowUserDropdown(false);
                      }}
                    >
                      {u.username}
                    </button>
                  ))}
              </div>
            )}
          </div>
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
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(order.order_number)}
                      disabled={approvingOrderNumber === order.order_number}
                    >
                      {approvingOrderNumber === order.order_number
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

