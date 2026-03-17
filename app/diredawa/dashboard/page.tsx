"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/authProvider";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck,
  Package,
  ShoppingCart,
  FileCheck,
  AlertTriangle,
  Truck,
  ArrowRight,
  Users,
  BarChart3,
} from "lucide-react";

const fetcherWithCreds = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => {
    if (!r.ok) throw new Error("Fetch failed");
    return r.json();
  });

interface Order {
  id: string;
  order_number: string;
  status: string;
  order_date?: string;
  buyer?: string;
}

interface Purchase {
  id: string;
  purchase_number: string;
  status: string;
  order_date?: string;
  buyer?: string;
}

interface StockItem {
  item_name: string;
  quantity?: number;
  package?: number;
}

interface ShippingInvoice {
  id: string;
  invoice_number: string;
  order_number: string;
  authorized_by?: string | null;
  authorized_at?: string | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (auth && !auth.isAdmin) {
      router.replace("/");
    }
  }, [auth, router]);

  const { data: orders = [] } = useSWR<Order[]>("/api/orders", fetcherWithCreds, {
    revalidateOnFocus: false,
  });
  const { data: purchases = [] } = useSWR<Purchase[]>(
    "/api/purchases",
    fetcherWithCreds,
    { revalidateOnFocus: false }
  );
  const { data: stock = [] } = useSWR<StockItem[]>(
    "/api/inventory/stock",
    fetcherWithCreds,
    { revalidateOnFocus: false }
  );
  const { data: invoices = [] } = useSWR<ShippingInvoice[]>(
    "/api/inventory/shipping-invoices",
    fetcherWithCreds,
    { revalidateOnFocus: false }
  );

  const ordersPending = orders.filter((o) => o.status === "pending");
  const ordersApproved = orders.filter((o) => o.status === "approved");
  const purchasesPending = purchases.filter((p) => p.status === "pending");
  const purchasesApproved = purchases.filter((p) => p.status === "approved");
  const negativeStock = stock.filter(
    (s) => (s.quantity ?? 0) < 0 || (s.package ?? 0) < 0
  );
  const invoicesPendingAuth = invoices.filter(
    (i) => !i.authorized_by || i.authorized_by.trim() === ""
  );

  const statCards = [
    {
      title: "Orders Pending Approval",
      value: ordersPending.length,
      icon: ClipboardCheck,
      href: "/diredawa/approvals/orders",
      color: "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20",
      iconColor: "text-amber-600",
    },
    {
      title: "Orders Awaiting Completion",
      value: ordersApproved.length,
      icon: FileCheck,
      href: "/diredawa/status/orders",
      color: "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20",
      iconColor: "text-blue-600",
    },
    {
      title: "Purchases Pending Approval",
      value: purchasesPending.length,
      icon: ShoppingCart,
      href: "/diredawa/approvals/purchases",
      color: "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20",
      iconColor: "text-amber-600",
    },
    {
      title: "Purchases Awaiting Completion",
      value: purchasesApproved.length,
      icon: Package,
      href: "/diredawa/status/purchases",
      color: "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20",
      iconColor: "text-blue-600",
    },
    {
      title: "Invoices Pending Authorization",
      value: invoicesPendingAuth.length,
      icon: Truck,
      href: "/diredawa/orders/display",
      color: "border-violet-500/50 bg-violet-50/50 dark:bg-violet-950/20",
      iconColor: "text-violet-600",
    },
    {
      title: "Negative Stock Items",
      value: negativeStock.length,
      icon: AlertTriangle,
      href: "/diredawa/inventory/stock",
      color:
        negativeStock.length > 0
          ? "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
          : "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20",
      iconColor:
        negativeStock.length > 0 ? "text-red-600" : "text-emerald-600",
    },
  ];

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.order_date || 0).getTime() -
        new Date(a.order_date || 0).getTime()
    )
    .slice(0, 5);

  const recentPurchases = [...purchases]
    .sort(
      (a, b) =>
        new Date(b.order_date || 0).getTime() -
        new Date(a.order_date || 0).getTime()
    )
    .slice(0, 5);

  if (!auth?.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of orders, purchases, inventory, and approvals
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${card.color}`}
              onClick={() => router.push(card.href)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <span>View</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Jump to key admin functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/diredawa/approvals/orders")}
            >
              Approve Orders
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/diredawa/approvals/purchases")}
            >
              Approve Purchases
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/diredawa/status/orders")}
            >
              Order Status
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/diredawa/status/purchases")}
            >
              Purchase Status
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/diredawa/users")}
            >
              User Management
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/diredawa/inventory/stock")}
            >
              Stock
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest 5 orders</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No orders yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2"
                    onClick={() =>
                      router.push(`/diredawa/orders/${o.order_number}`)
                    }
                  >
                    <span className="font-medium">{o.order_number}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        o.status === "pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                          : o.status === "approved"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                            : o.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="link"
              className="mt-2 p-0 h-auto"
              onClick={() => router.push("/diredawa/orders/display")}
            >
              View all orders →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
            <CardDescription>Latest 5 purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPurchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No purchases yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentPurchases.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2"
                    onClick={() =>
                      router.push(
                        `/diredawa/purchase/${p.purchase_number}`
                      )
                    }
                  >
                    <span className="font-medium">{p.purchase_number}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        p.status === "pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                          : p.status === "approved"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                            : p.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="link"
              className="mt-2 p-0 h-auto"
              onClick={() => router.push("/diredawa/purchase/display")}
            >
              View all purchases →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Negative Stock Alert */}
      {negativeStock.length > 0 && (
        <Card className="border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              Negative Stock Alert
            </CardTitle>
            <CardDescription>
              {negativeStock.length} item(s) have negative stock. Review and
              update inventory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {negativeStock.slice(0, 5).map((s, i) => (
                <li key={i}>
                  {s.item_name} — Qty: {s.quantity ?? 0}, Bags: {s.package ?? 0}
                </li>
              ))}
              {negativeStock.length > 5 && (
                <li className="text-muted-foreground">
                  +{negativeStock.length - 5} more
                </li>
              )}
            </ul>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/diredawa/inventory/stock")}
            >
              View Stock
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
