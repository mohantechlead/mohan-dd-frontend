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
    items: [
      { title: "Order Status", url: "/diredawa/status/orders" },
      { title: "Purchase Status", url: "/diredawa/status/purchases" },
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
    title: "Inventory",
    url: "#",
    icon: Package,
    items: [
      { title: "Add GRN", url: "/diredawa/inventory/grn/create", storeVisible: true },
      { title: "Display GRN", url: "/diredawa/inventory/grn/display", storeVisible: true },
      { title: "Add DN", url: "/diredawa/inventory/dn/create", storeVisible: true },
      { title: "Display DN", url: "/diredawa/inventory/dn/display", storeVisible: true },
      { title: "Items", url: "/diredawa/inventory/items/create" },
      { title: "Stock", url: "/diredawa/inventory/stock" },
    ],
  },
  {
    title: "Approvals",
    url: "#",
    icon: CheckSquare,
    adminOnly: true,
    items: [
      { title: "Order Approval", url: "/diredawa/approvals/orders" },
      { title: "Purchase Approval", url: "/diredawa/approvals/purchases" },
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

  const navMain = React.useMemo(() => {
    let items = baseNavMain.filter((item) => !(item as { adminOnly?: boolean }).adminOnly || isAdmin);
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
  }, [isAdmin, isStore]);

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
