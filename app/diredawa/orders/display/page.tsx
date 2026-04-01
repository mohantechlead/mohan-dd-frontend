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
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
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

  useEffect(() => {
    setPageIndex(0);
  }, [search]);

  const pagedOrders = useMemo(
    () => slicePage(filteredOrders, pageIndex, pageSize),
    [filteredOrders, pageIndex, pageSize]
  );

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

      // Ensure newest/highest order numbers show first.
      // Order numbers look like "M1047", so compare by the numeric portion.
      const extractOrderNumber = (value?: string) => {
        const matches = (value ?? "").match(/\d+/g);
        if (!matches || matches.length === 0) return -Infinity;
        const last = matches[matches.length - 1];
        const n = Number(last);
        return Number.isFinite(n) ? n : -Infinity;
      };

      const sorted = [...(data as Order[])].sort((a, b) => {
        const aNum = extractOrderNumber(a.order_number);
        const bNum = extractOrderNumber(b.order_number);
        if (bNum !== aNum) return bNum - aNum;
        return (b.order_number ?? "").localeCompare(a.order_number ?? "");
      });
      setOrders(sorted);
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

  const getStatusClasses = (status?: string | null) => {
    const value = (status || "").toLowerCase();
    if (value === "pending") {
      return "bg-amber-100 text-amber-800";
    }
    if (value === "approved") {
      return "bg-blue-100 text-blue-800";
    }
    if (value === "completed") {
      return "bg-emerald-100 text-emerald-800";
    }
    if (value === "cancelled") {
      return "bg-rose-100 text-rose-800";
    }
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="max-w-6xl mx-auto mt-4 space-y-6">
      <div className="flex justify-between items-center">
        <Button className="rounded-lg shadow-sm" onClick={() => router.push("/diredawa/orders/create")}>
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
          <div className="rounded-xl border border-border bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-100/80 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 border-b border-border font-semibold text-slate-700">
                  Order Number
                </th>
                <th className="text-left px-4 py-3 border-b border-border font-semibold text-slate-700">
                  Date
                </th>
                <th className="text-left px-4 py-3 border-b border-border font-semibold text-slate-700">
                  Items
                </th>
                <th className="text-right px-4 py-3 border-b border-border font-semibold text-slate-700">
                  Quantity
                </th>
                <th className="text-right px-4 py-3 border-b border-border font-semibold text-slate-700">
                  Unit Price
                </th>
                <th className="text-right px-4 py-3 border-b border-border font-semibold text-slate-700">
                  Total Price
                </th>
                <th className="text-left px-4 py-3 border-b border-border font-semibold text-slate-700">
                  Customer Name
                </th>
                <th className="text-left px-4 py-3 border-b border-border font-semibold text-slate-700">
                  Approved By
                </th>
                <th className="text-left px-4 py-3 border-b border-border font-semibold text-slate-700">
                  Status
                </th>
                {auth?.isAdmin && (
                  <th className="text-right px-4 py-3 border-b border-border font-semibold text-slate-700">
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
              pagedOrders.flatMap((order, orderIdx) =>
                order.items.length > 0
                  ? order.items.map((item, idx) => (
                      <tr
                        key={`${order.id}-${idx}`}
                        className={
                          orderIdx > 0 && idx === 0
                            ? "border-t-4 border-t-slate-300 bg-white hover:bg-slate-50/60"
                            : "border-t border-t-slate-200 bg-white hover:bg-slate-50/60"
                        }
                      >
                        {idx === 0 ? (
                          <>
                            <td
                              className="px-4 py-2 border-r border-slate-200 align-top font-medium"
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
                              className="px-4 py-2 border-r border-slate-200 align-top text-slate-700"
                              rowSpan={order.items.length}
                            >
                              {new Date(
                                order.order_date
                              ).toLocaleDateString()}
                            </td>
                          </>
                        ) : null}
                        <td className="px-4 py-2 border-r border-slate-200">
                          {item.item_name}
                        </td>
                        <td className="px-4 py-2 text-right border-r border-slate-200 tabular-nums">
                          {item.quantity.toLocaleString(undefined, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                        </td>
                        <td className="px-4 py-2 text-right border-r border-slate-200 tabular-nums">
                          {item.price.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-2 text-right border-r border-slate-200 tabular-nums">
                          {item.total_price.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        {idx === 0 ? (
                          <>
                            <td
                              className="px-4 py-2 border-r border-slate-200 align-top"
                              rowSpan={order.items.length}
                            >
                              {order.buyer}
                            </td>
                            <td
                              className="px-4 py-2 border-r border-slate-200 align-top"
                              rowSpan={order.items.length}
                            >
                              {order.approved_by ?? "—"}
                            </td>
                            <td
                              className="px-4 py-2 border-r border-slate-200 capitalize align-top"
                              rowSpan={order.items.length}
                            >
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(order.status)}`}>
                                {order.status ?? "—"}
                              </span>
                            </td>
                            {auth?.isAdmin && (
                              <td
                                className="px-4 py-2 text-right align-top"
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
                        <td className="px-4 py-2 border-r border-slate-200">
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
                        <td className="px-4 py-2 border-r border-slate-200">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                        <td
                          className="px-4 py-2 border-r border-slate-200"
                          colSpan={4}
                        >
                          <span className="text-xs text-muted-foreground">
                            No items
                          </span>
                        </td>
                        <td className="px-4 py-2 border-r border-slate-200">
                          {order.buyer}
                        </td>
                        <td className="px-4 py-2 border-r border-slate-200">
                          {order.approved_by ?? "—"}
                        </td>
                        <td className="px-4 py-2 border-r border-slate-200 capitalize">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(order.status)}`}>
                            {order.status ?? "—"}
                          </span>
                        </td>
                        {auth?.isAdmin && (
                          <td className="px-4 py-2 text-right">
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

        <div className="border border-border border-t-0 rounded-b-md overflow-hidden bg-white">
          <TablePagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalItems={filteredOrders.length}
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

