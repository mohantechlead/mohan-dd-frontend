"use client";

import * as React from "react";
import {
  Building2,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  Package,
  ShoppingBag,
  ShoppingCart,
  Users,
  Users2,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
// import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { useAuth } from "@/components/authProvider";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

// Base nav data - Status and Approvals are admin-only
// storeVisible: true = store role can see this item (Display Sales, Add GRN, Add DN, Loading Instruction)
// adminLogisticsHidden: true = hide from admin and logistics (only store sees it)
const baseNavMain = [
  {
    title: "Dashboard",
    url: "/diredawa/dashboard",
    icon: LayoutDashboard,
    adminOnly: true,
    items: [{ title: "Admin Dashboard", url: "/diredawa/dashboard" }],
  },
  {
    title: "Status",
    url: "#",
    icon: ClipboardList,
    isActive: true,
    adminOnly: true,
    accountingVisible: true,
    items: [
      { title: "Order Status", url: "/diredawa/status/orders" },
      { title: "Purchase Status", url: "/diredawa/status/purchases" },
      {
        title: "Payment Status",
        url: "#",
        accountingVisible: true,
        items: [
          { title: "Received Payment Status", url: "/diredawa/status/received-payments" },
          { title: "Vendor Payment Status", url: "/diredawa/status/vendor-payments" },
          { title: "Expense Payment Status", url: "/diredawa/status/expense-payments" },
        ],
      },
    ],
  },
  {
    title: "Customers",
    url: "#",
    icon: Users2,
    items: [
      { title: "Create Customers", url: "/diredawa/partners/customers/create" },
      { title: "Display Customers", url: "/diredawa/partners/customers/display" },
    ],
  },
  {
    title: "Suppliers",
    url: "#",
    icon: Building2,
    items: [
      { title: "Create Suppliers", url: "/diredawa/partners/suppliers/create" },
      { title: "Display Suppliers", url: "/diredawa/partners/suppliers/display" },
    ],
  },
  {
    title: "Sales",
    url: "#",
    icon: ShoppingCart,
    items: [
      { title: "Create Sales", url: "/diredawa/orders/create" },
      { title: "Display Sales", url: "/diredawa/orders/display" },
      { title: "Authorized loading instructions", url: "/diredawa/loading-instructions/authorized", storeVisible: true, adminLogisticsHidden: true },
      { title: "Rejected Orders", url: "/diredawa/sales/rejected" },
      { title: "Completed Orders", url: "/diredawa/sales/completed" },
    ],
  },
  {
    title: "Purchase",
    url: "#",
    icon: ShoppingBag,
    items: [
      { title: "Create Purchase", url: "/diredawa/purchase/create" },
      { title: "Display Purchase", url: "/diredawa/purchase/display" },
      { title: "Rejected Purchases", url: "/diredawa/purchase/rejected" },
      { title: "Completed Purchases", url: "/diredawa/purchase/completed" },
    ],
  },
  {
    title: "Accounting",
    url: "#",
    icon: ClipboardList,
    accountingVisible: true,
    items: [
      {
        title: "Received Payments",
        url: "#",
        items: [
          { title: "Create Received Payment", url: "/diredawa/accounting/received-payments/create" },
          { title: "Display Received Payment", url: "/diredawa/accounting/received-payments/display" },
          { title: "Rejected Received Payments", url: "/diredawa/accounting/received-payments/rejected" },
          { title: "Completed Received Payments", url: "/diredawa/accounting/received-payments/completed" },
        ],
      },
      {
        title: "Vendor Payments",
        url: "#",
        items: [
          { title: "Create Vendor Payment", url: "/diredawa/accounting/vendor-payments/create" },
          { title: "Display Vendor Payment", url: "/diredawa/accounting/vendor-payments/display" },
          { title: "Rejected Vendor Payments", url: "/diredawa/accounting/vendor-payments/rejected" },
          { title: "Completed Vendor Payments", url: "/diredawa/accounting/vendor-payments/completed" },
        ],
      },
      {
        title: "Expense Payments",
        url: "#",
        items: [
          { title: "Create Expense Payment", url: "/diredawa/accounting/expense-payments/create" },
          { title: "Display Expense Payment", url: "/diredawa/accounting/expense-payments/display" },
          { title: "Rejected Expense Payments", url: "/diredawa/accounting/expense-payments/rejected" },
          { title: "Completed Expense Payments", url: "/diredawa/accounting/expense-payments/completed" },
        ],
      },
    ],
  },
  {
    title: "Inventory",
    url: "#",
    icon: Package,
    items: [
      { title: "Add GRN", url: "/diredawa/inventory/grn/create", storeVisible: true },
      { title: "Display GRN", url: "/diredawa/inventory/grn/display", storeVisible: true },
      { title: "Add DN", url: "/diredawa/inventory/dn/create", storeVisible: true },
      { title: "Display DN", url: "/diredawa/inventory/dn/display", storeVisible: true },
      { title: "GIT", url: "/diredawa/inventory/git/display" },
      { title: "Items", url: "/diredawa/inventory/items/create" },
      { title: "Stock", url: "/diredawa/inventory/stock", storeVisible: true },
    ],
  },
  {
    title: "Approvals",
    url: "#",
    icon: CheckSquare,
    adminOnly: true,
    accountingVisible: true,
    items: [
      { title: "Order Approval", url: "/diredawa/approvals/orders" },
      { title: "Purchase Approval", url: "/diredawa/approvals/purchases" },
      {
        title: "Payment Approvals",
        url: "#",
        accountingVisible: true,
        items: [
          { title: "Received Payment Approval", url: "/diredawa/approvals/received-payments" },
          { title: "Vendor Payment Approval", url: "/diredawa/approvals/vendor-payments" },
          { title: "Expense Payment Approval", url: "/diredawa/approvals/expense-payments" },
        ],
      },
    ],
  },
  {
    title: "Users",
    url: "#",
    icon: Users,
    adminOnly: true,
    items: [{ title: "User Management", url: "/diredawa/users" }],
  },
];

const data = {
  user: {
    name: "shadcn",
    email: "",
    avatar: "/avatars/shadcn.jpg",
  },
};

/** Placeholder shown during SSR/initial hydration to avoid Radix ID mismatch */
function SidebarNavSkeleton() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {[1, 2, 3, 4, 5].map((i) => (
          <SidebarMenuItem key={i}>
            <div className="flex h-8 items-center gap-2 rounded-md px-2">
              <Skeleton className="size-4 rounded-md" />
              <Skeleton className="h-4 flex-1" style={{ maxWidth: "70%" }} />
            </div>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const auth = useAuth();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isAdmin = mounted ? (auth?.isAdmin ?? false) : false;
  const isStore = mounted ? (auth?.isStore ?? false) : false;
  const isAccounting = mounted ? (auth?.isAccounting ?? false) : false;

  const navMain = React.useMemo(() => {
    const filterAccountingItems = (
      items: Array<Record<string, unknown>>,
      inheritVisible = false
    ): Array<Record<string, unknown>> =>
      items
        .filter((item) => inheritVisible || Boolean(item.accountingVisible))
        .map((item) => {
          const children = Array.isArray(item.items)
            ? filterAccountingItems(
                item.items as Array<Record<string, unknown>>,
                inheritVisible || Boolean(item.accountingVisible)
              )
            : undefined;
          return {
            ...item,
            ...(children ? { items: children } : {}),
          };
        })
        .filter((item) => !Array.isArray(item.items) || item.items.length > 0);

    let items = baseNavMain.filter((item) => {
      const adminOnly = Boolean((item as { adminOnly?: boolean }).adminOnly);
      if (!adminOnly) return true;
      return isAdmin || isAccounting;
    });
    if (isStore) {
      items = items
        .filter((section) => {
          const sectionItems = (section as { items?: { storeVisible?: boolean }[] }).items ?? [];
          return sectionItems.some((sub) => (sub as { storeVisible?: boolean }).storeVisible);
        })
        .map((section) => ({
          ...section,
          items: ((section as { items?: { storeVisible?: boolean; title: string; url: string }[] }).items ?? []).filter(
            (sub) => (sub as { storeVisible?: boolean }).storeVisible
          ),
        })) as typeof baseNavMain;
    } else if (isAccounting && !isAdmin) {
      items = items.filter((section) => section.title === "Accounting") as typeof baseNavMain;
    } else {
      // Admin and logistics: hide items with adminLogisticsHidden
      items = items.map((section) => ({
        ...section,
        items: ((section as { items?: { adminLogisticsHidden?: boolean }[] }).items ?? []).filter(
          (sub) => !(sub as { adminLogisticsHidden?: boolean }).adminLogisticsHidden
        ),
      })) as typeof baseNavMain;
    }
    return items;
  }, [isAdmin, isStore, isAccounting]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-3 border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-1.5 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            M
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]/sidebar-wrapper:hidden">
            <div className="truncate text-sm font-semibold leading-tight">
              Mohan PLC
            </div>
            <div className="truncate text-xs text-sidebar-foreground/70">
              Dire Dawa
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {mounted ? <NavMain items={navMain} /> : <SidebarNavSkeleton />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
