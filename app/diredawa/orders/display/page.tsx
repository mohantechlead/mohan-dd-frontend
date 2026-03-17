"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { TableSearch } from "@/components/table-search";

interface OrderItem {
  item_name: string;
  hs_code: string;
  price: number;
  quantity: number;
  total_price: number;
  measurement: string;
}

interface Order {
  id: string;
  order_number: string;
  order_date: string;
  buyer: string;
  proforma_ref_no: string;
  status: string;
  approved_by?: string | null;
  items: OrderItem[];
}

const ORDERS_API_URL = "/api/orders";

export default function DisplayOrdersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const auth = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.buyer.toLowerCase().includes(q) ||
        (o.proforma_ref_no?.toLowerCase().includes(q)) ||
        (o.status?.toLowerCase().includes(q)) ||
        o.items.some((i) => i.item_name.toLowerCase().includes(q))
    );
  }, [orders, search]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(ORDERS_API_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        showToast({
          title: "Failed to load orders",
          description:
            (data as { detail?: string; message?: string })?.detail ||
            (data as { detail?: string; message?: string })?.message ||
            "Please try again.",
          variant: "error",
        });
        return;
      }

      setOrders(data as Order[]);
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

  useEffect(() => {
    fetchOrders();
  }, [showToast]);

  const openDelete = (order: Order) => {
    setOrderToDelete(order);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${ORDERS_API_URL}/${encodeURIComponent(orderToDelete.order_number)}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to delete order",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Order deleted", variant: "success" });
      setDeleteOpen(false);
      setOrderToDelete(null);
      fetchOrders();
    } catch {
      showToast({
        title: "Failed to delete order",
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
        <Button onClick={() => router.push("/diredawa/orders/create")}>
          Create Sales
        </Button>
        <h1 className="text-2xl font-bold text-center flex-1">
          Sales Orders
        </h1>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No orders found.
        </p>
      ) : (
        <>
          <div className="flex justify-end mb-4">
          <TableSearch value={search} onChange={setSearch} placeholder="Search orders, customer, items..." />
        </div>
          <div className="border border-border rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-left px-4 py-2 border border-border">
                  Order Number
                </th>
                <th className="text-left px-4 py-2 border border-border">
                  Date
                </th>
                <th className="text-left px-4 py-2 border border-border">
                  Items
                </th>
                <th className="text-right px-4 py-2 border border-border">
                  Quantity
                </th>
                <th className="text-right px-4 py-2 border border-border">
                  Unit Price
                </th>
                <th className="text-right px-4 py-2 border border-border">
                  Total Price
                </th>
                <th className="text-left px-4 py-2 border border-border">
                  Customer Name
                </th>
                <th className="text-left px-4 py-2 border border-border">
                  Approved By
                </th>
                <th className="text-left px-4 py-2 border border-border">
                  Status
                </th>
                {auth?.isAdmin && (
                  <th className="text-right px-4 py-2 border border-border">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={auth?.isAdmin ? 9 : 8} className="px-4 py-8 text-center text-muted-foreground">
                    No results match your search.
                  </td>
                </tr>
              ) : (
              filteredOrders.flatMap((order, orderIdx) =>
                order.items.length > 0
                  ? order.items.map((item, idx) => (
                      <tr
                        key={`${order.id}-${idx}`}
                        className={
                          orderIdx > 0 && idx === 0
                            ? "border-t-4 border-t-border"
                            : "border-t border-t-border"
                        }
                      >
                        {idx === 0 ? (
                          <>
                            <td
                              className="px-4 py-2 border border-border align-top"
                              rowSpan={order.items.length}
                            >
                              {auth?.isStore ? (
                                <span>{order.order_number}</span>
                              ) : (
                                <button
                                  type="button"
                                  className="text-blue-600 hover:underline"
                                  onClick={() =>
                                    router.push(
                                      `/diredawa/orders/${order.order_number}`
                                    )
                                  }
                                >
                                  {order.order_number}
                                </button>
                              )}
                            </td>
                            <td
                              className="px-4 py-2 border border-border align-top"
                              rowSpan={order.items.length}
                            >
                              {new Date(
                                order.order_date
                              ).toLocaleDateString()}
                            </td>
                          </>
                        ) : null}
                        <td className="px-4 py-2 border border-border">
                          {item.item_name}
                        </td>
                        <td className="px-4 py-2 text-right border border-border">
                          {item.quantity.toLocaleString(undefined, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                        </td>
                        <td className="px-4 py-2 text-right border border-border">
                          {item.price.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-2 text-right border border-border">
                          {item.total_price.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        {idx === 0 ? (
                          <>
                            <td
                              className="px-4 py-2 border border-border align-top"
                              rowSpan={order.items.length}
                            >
                              {order.buyer}
                            </td>
                            <td
                              className="px-4 py-2 border border-border align-top"
                              rowSpan={order.items.length}
                            >
                              {order.approved_by ?? "—"}
                            </td>
                            <td
                              className="px-4 py-2 border border-border capitalize align-top"
                              rowSpan={order.items.length}
                            >
                              {order.status ?? "—"}
                            </td>
                            {auth?.isAdmin && (
                              <td
                                className="px-4 py-2 text-right border border-border align-top"
                                rowSpan={order.items.length}
                              >
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        `/diredawa/orders/${order.order_number}/edit`
                                      )
                                    }
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDelete(order)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </>
                        ) : null}
                      </tr>
                    ))
                  : [
                      <tr key={order.id}>
                        <td className="px-4 py-2 border border-border">
                          {auth?.isStore ? (
                            <span>{order.order_number}</span>
                          ) : (
                            <button
                              type="button"
                              className="text-blue-600 hover:underline"
                              onClick={() =>
                                router.push(
                                  `/diredawa/orders/${order.order_number}`
                                )
                              }
                            >
                              {order.order_number}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-2 border border-border">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                        <td
                          className="px-4 py-2 border border-border"
                          colSpan={4}
                        >
                          <span className="text-xs text-muted-foreground">
                            No items
                          </span>
                        </td>
                        <td className="px-4 py-2 border border-border">
                          {order.buyer}
                        </td>
                        <td className="px-4 py-2 border border-border">
                          {order.approved_by ?? "—"}
                        </td>
                        <td className="px-4 py-2 border border-border capitalize">
                          {order.status ?? "—"}
                        </td>
                        {auth?.isAdmin && (
                          <td className="px-4 py-2 text-right border border-border">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/diredawa/orders/${order.order_number}/edit`
                                  )
                                }
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDelete(order)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>,
                    ]
              )
              )}
            </tbody>
          </table>
        </div>
        </>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete order &quot;{orderToDelete?.order_number}&quot;? This action cannot be undone.
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

