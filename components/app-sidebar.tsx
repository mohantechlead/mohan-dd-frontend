"use client";

import * as React from "react";
import {
  Building2,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  Package,
  ShoppingBag,
  ShoppingCart,
  Truck,
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
// transitorOnly: true = only the transitor role sees this section
const baseNavMain = [
  {
    title: "Dashboard",
    url: "/diredawa/dashboard",
    icon: LayoutDashboard,
    adminOnly: true,
    items: [
      { title: "Admin Dashboard", url: "/diredawa/dashboard" },
      { title: "Analytics", url: "/diredawa/reports" },
    ],
  },
  {
    title: "AI Assistant",
    url: "/diredawa/ai-assistant",
    icon: MessageCircle,
    items: [
      { title: "AI Assistant", url: "/diredawa/ai-assistant", storeVisible: true },
    ],
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
    title: "Transit",
    url: "/diredawa/transit",
    icon: Truck,
    transitorOnly: true,
    items: [{ title: "My Checkpoints", url: "/diredawa/transit", transitorOnly: true }],
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
      {
        title: "Warehouse Payments",
        url: "#",
        items: [
          { title: "Create Warehouse Payment", url: "/diredawa/accounting/warehouse-payments/create" },
          { title: "Display Warehouse Payments", url: "/diredawa/accounting/warehouse-payments/display" },
        ],
      },
      {
        title: "Storage Prices",
        url: "/diredawa/accounting/warehouse-storage-prices",
      },
      {
        title: "Expiration Fee Tiers",
        url: "/diredawa/accounting/warehouse-expiration-tiers",
      },
      {
        title: "Ledger",
        url: "/diredawa/accounting/ledger",
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
    title: "In-Warehouse",
    url: "#",
    icon: Package,
    accountingVisible: true,
    items: [
      {
        title: "Storage Notes",
        url: "#",
        accountingVisible: true,
        items: [
          { title: "New Storage Note", url: "/diredawa/inventory/warehouse-storage-notes/create", storeVisible: true },
          { title: "Display Storage Notes", url: "/diredawa/inventory/warehouse-storage-notes/display", storeVisible: true },
        ],
      },
      {
        title: "Release Notes",
        url: "#",
        accountingVisible: true,
        storeVisible: true,
        items: [
          { title: "New Release Note", url: "/diredawa/inventory/warehouse-release-notes/create", storeVisible: true },
          { title: "Display Release Notes", url: "/diredawa/inventory/warehouse-release-notes/display", storeVisible: true },
        ],
      },
      { title: "Expired / Expiring", url: "/diredawa/inventory/warehouse-expiry", accountingVisible: true, storeVisible: true },
      { title: "Item Inventory", url: "/diredawa/inventory/warehouse-item-inventory", accountingVisible: true, storeVisible: true },
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
      { title: "Warehouse Settings Approval", url: "/diredawa/approvals/warehouse-settings", accountingVisible: true },
      { title: "Stock Adjustment Approval", url: "/diredawa/approvals/stock-adjustments", accountingVisible: true },
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
  const isTransitor = mounted ? (auth?.isTransitor ?? false) : false;

  const navMain = React.useMemo(() => {
    let items = baseNavMain.filter((item) => {
      const adminOnly = Boolean((item as { adminOnly?: boolean }).adminOnly);
      const transitorOnly = Boolean((item as { transitorOnly?: boolean }).transitorOnly);
      if (transitorOnly) return isTransitor;
      if (!adminOnly) return true;
      return isAdmin || isAccounting;
    });
    if (isTransitor) {
      // Transitor sees only the Transit section
      items = items.filter((section) =>
        Boolean((section as { transitorOnly?: boolean }).transitorOnly)
      ) as typeof baseNavMain;
    } else if (isStore) {
      // Recursively keep only items flagged storeVisible (and their ancestors).
      const filterStoreItems = <T extends { storeVisible?: boolean; items?: T[] }>(
        list: T[],
      ): T[] =>
        list
          .map((item) => {
            const children = Array.isArray(item.items)
              ? filterStoreItems(item.items)
              : undefined;
            const hasVisibleChildren = (children?.length ?? 0) > 0;
            if (!item.storeVisible && !hasVisibleChildren) return null;
            return {
              ...item,
              ...(children ? { items: children } : {}),
            };
          })
          .filter((item): item is T => item !== null);

      items = items
        .filter((section) => {
          const sectionItems = (section as { items?: { storeVisible?: boolean; items?: unknown[] }[] }).items ?? [];
          return sectionItems.some(
            (sub) =>
              Boolean((sub as { storeVisible?: boolean }).storeVisible) ||
              (Array.isArray((sub as { items?: unknown[] }).items) &&
                ((sub as { items?: { storeVisible?: boolean }[] }).items ?? []).some(
                  (nested) => Boolean((nested as { storeVisible?: boolean }).storeVisible),
                )),
          );
        })
        .map((section) => ({
          ...section,
          items: filterStoreItems(
            (section as { items?: { storeVisible?: boolean; title: string; url: string; items?: never[] }[] }).items ?? [],
          ),
        })) as typeof baseNavMain;
    } else if (isAccounting && !isAdmin) {
      // Accounting sees Accounting, AI Assistant, In-Warehouse, and Approvals sections.
      items = items.filter(
        (section) =>
          section.title === "Accounting" ||
          section.title === "AI Assistant" ||
          section.title === "In-Warehouse" ||
          section.title === "Approvals",
      ) as typeof baseNavMain;
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
  }, [isAdmin, isStore, isAccounting, isTransitor]);

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
