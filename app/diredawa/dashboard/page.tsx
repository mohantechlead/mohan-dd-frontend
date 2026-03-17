"use client";

import { useEffect, useSyncExternalStore } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

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

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function AdminDashboardPage() {
  const router = useRouter();
  const auth = useAuth();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  useEffect(() => {
    if (mounted && auth && !auth.isAdmin) {
      router.replace("/");
    }
  }, [mounted, auth, router]);

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container mx-auto pt-4 pb-10 px-4 space-y-10">
          <div className="rounded-2xl bg-slate-200 dark:bg-slate-800 px-8 py-10">
            <Skeleton className="h-8 w-14 rounded" />
            <Skeleton className="mt-2 h-5 w-96" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!auth?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto pt-2 pb-10 px-4 space-y-5">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-800 dark:to-slate-900 px-8 py-10 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <BarChart3 className="h-8 w-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-slate-300">
                Overview of orders, purchases, inventory, and approvals
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.title}
                className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${card.color} border-2`}
                onClick={() => router.push(card.href)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className="rounded-lg bg-background/50 p-2 transition-transform group-hover:scale-110">
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">{card.value}</div>
                  <div className="mt-3 flex items-center gap-1 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    <span>View details</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription className="text-base">
              Jump to key admin functions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="lg"
                className="h-11 rounded-lg border-2 transition-all hover:border-primary/50 hover:bg-primary/5"
                onClick={() => router.push("/diredawa/approvals/orders")}
              >
                Approve Orders
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-11 rounded-lg border-2 transition-all hover:border-primary/50 hover:bg-primary/5"
                onClick={() => router.push("/diredawa/approvals/purchases")}
              >
                Approve Purchases
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-11 rounded-lg border-2 transition-all hover:border-primary/50 hover:bg-primary/5"
                onClick={() => router.push("/diredawa/status/orders")}
              >
                Order Status
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-11 rounded-lg border-2 transition-all hover:border-primary/50 hover:bg-primary/5"
                onClick={() => router.push("/diredawa/status/purchases")}
              >
                Purchase Status
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-11 rounded-lg border-2 transition-all hover:border-primary/50 hover:bg-primary/5"
                onClick={() => router.push("/diredawa/users")}
              >
                User Management
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-11 rounded-lg border-2 transition-all hover:border-primary/50 hover:bg-primary/5"
                onClick={() => router.push("/diredawa/inventory/stock")}
              >
                Stock
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2 shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <CardDescription>Latest 5 orders</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {recentOrders.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No orders yet
                </p>
              ) : (
                <div className="space-y-1">
                  {recentOrders.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded-lg py-3 px-3 cursor-pointer transition-colors hover:bg-muted/60"
                      onClick={() =>
                        router.push(`/diredawa/orders/${o.order_number}`)
                      }
                    >
                      <span className="font-semibold">{o.order_number}</span>
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${
                          o.status === "pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                            : o.status === "approved"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                              : o.status === "completed"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
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
                className="mt-4 p-0 h-auto font-semibold"
                onClick={() => router.push("/diredawa/orders/display")}
              >
                View all orders →
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg">Recent Purchases</CardTitle>
              <CardDescription>Latest 5 purchases</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {recentPurchases.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No purchases yet
                </p>
              ) : (
                <div className="space-y-1">
                  {recentPurchases.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg py-3 px-3 cursor-pointer transition-colors hover:bg-muted/60"
                      onClick={() =>
                        router.push(
                          `/diredawa/purchase/${p.purchase_number}`
                        )
                      }
                    >
                      <span className="font-semibold">{p.purchase_number}</span>
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${
                          p.status === "pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                            : p.status === "approved"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                              : p.status === "completed"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
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
                className="mt-4 p-0 h-auto font-semibold"
                onClick={() => router.push("/diredawa/purchase/display")}
              >
                View all purchases →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Negative Stock Alert */}
        {negativeStock.length > 0 && (
          <Card className="border-2 border-red-500/60 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-red-800 dark:text-red-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                Negative Stock Alert
              </CardTitle>
              <CardDescription className="text-base text-red-700/80 dark:text-red-300/80">
                {negativeStock.length} item(s) have negative stock. Review and
                update inventory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {negativeStock.slice(0, 5).map((s, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg bg-white/50 dark:bg-black/20 px-3 py-2">
                    <span className="font-medium">{s.item_name}</span>
                    <span className="text-muted-foreground">
                      — Qty: {s.quantity ?? 0}, Bags: {s.package ?? 0}
                    </span>
                  </li>
                ))}
                {negativeStock.length > 5 && (
                  <li className="text-muted-foreground px-3 py-2">
                    +{negativeStock.length - 5} more
                  </li>
                )}
              </ul>
              <Button
                variant="outline"
                size="lg"
                className="mt-4 border-red-300 bg-white/50 hover:bg-red-50 dark:border-red-800 dark:bg-red-950/30 dark:hover:bg-red-950/50"
                onClick={() => router.push("/diredawa/inventory/stock")}
              >
                View Stock
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
