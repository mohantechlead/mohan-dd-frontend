"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
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
const baseNavMain = [
  {
    title: "Status",
    url: "#",
    icon: SquareTerminal,
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
      icon: Bot,
      items: [
        {
          title: "Create Customers",
          url: "/diredawa/partners/customers/create",
        },
        {
          title: "Display Customers",
          url: "/diredawa/partners/customers/display",
        },
    ],
  },
  {
    title: "Suppliers",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Create Suppliers",
          url: "/diredawa/partners/suppliers/create",
        },
        {
          title: "Display Suppliers",
          url: "/diredawa/partners/suppliers/display",
        },
    ],
  },
  {
    title: "Sales",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Create Sales",
          url: "/diredawa/orders/create",
        },
        {
          title: "Display Sales",
          url: "/diredawa/orders/display",
        },
        {
          title: "Rejected Orders",
          url: "/diredawa/sales/rejected",
        },
        {
          title: "Completed Orders",
          url: "/diredawa/sales/completed",
        },
    ],
  },
  {
    title: "Purchase",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Create Purchase",
          url: "/diredawa/purchase/create",
        },
        {
          title: "Display Purchase",
          url: "/diredawa/purchase/display",
        },
        {
          title: "Rejected Purchases",
          url: "/diredawa/purchase/rejected",
        },
        {
          title: "Completed Purchases",
          url: "/diredawa/purchase/completed",
        },
    ],
  },
  {
    title: "Inventory",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "GRN",
          url: "/diredawa/inventory/grn/create",
        },
        {
          title: "DN",
          url: "/diredawa/inventory/dn/create",
        },
        {
          title: "Items",
          url: "/diredawa/inventory/items/create",
        },
        {
          title: "Stock",
          url: "/diredawa/inventory/stock",
        },
    ],
  },
  {
    title: "Approvals",
    url: "#",
    icon: Settings2,
    adminOnly: true,
    items: [
      { title: "Order Approval", url: "/diredawa/approvals/orders" },
      { title: "Purchase Approval", url: "/diredawa/approvals/purchases" },
    ],
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
  // Use isAdmin only after mount so server and first client render match (avoids hydration mismatch from localStorage)
  const isAdmin = mounted ? (auth?.isAdmin ?? false) : false;

  const navMain = React.useMemo(() => {
    return baseNavMain.filter((item) => !(item as { adminOnly?: boolean }).adminOnly || isAdmin);
  }, [isAdmin]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader></SidebarHeader>
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
