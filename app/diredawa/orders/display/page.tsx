"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(ORDERS_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();

        if (!res.ok) {
          showToast({
            title: "Failed to load orders",
            description:
              (data as any)?.detail ||
              (data as any)?.message ||
              "Please try again.",
            variant: "error",
          });
          return;
        }

        setOrders(data as Order[]);
      } catch (error) {
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
        <div className="border rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-left px-4 py-2">Order Number</th>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Items</th>
                <th className="text-right px-4 py-2">Quantity</th>
                <th className="text-right px-4 py-2">Unit Price</th>
                <th className="text-right px-4 py-2">Total Price</th>
                <th className="text-left px-4 py-2">Customer Name</th>
                <th className="text-left px-4 py-2">Approved By</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.flatMap((order) =>
                order.items.length > 0
                  ? order.items.map((item, idx) => (
                      <tr key={`${order.id}-${idx}`} className="border-t">
                        <td className="px-4 py-2">
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
                        </td>
                        <td className="px-4 py-2">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">{item.item_name}</td>
                        <td className="px-4 py-2 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {item.price.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {item.total_price.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-2">{order.buyer}</td>
                        <td className="px-4 py-2">
                          {order.approved_by ?? "—"}
                        </td>
                        <td className="px-4 py-2">
                          {order.status === "approved"
                            ? "approved"
                            : "pending"}
                        </td>
                      </tr>
                    ))
                  : [
                      <tr key={order.id} className="border-t" >
                        <td className="px-4 py-2">
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
                        </td>
                        <td className="px-4 py-2">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2" colSpan={5}>
                          <span className="text-xs text-muted-foreground">
                            No items
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {order.approved_by ?? "—"}
                        </td>
                        <td className="px-4 py-2">
                          {order.status === "approved"
                            ? "approved"
                            : "pending"}
                        </td>
                      </tr>,
                    ]
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

