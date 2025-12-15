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

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Status",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Order Status",
          url: "#",
        },
        {
          title: "Purchase Status",
          url: "#",
        },
        {
          title: "Rejected Orders",
          url: "#",
        },
      ],
    },
    {
      title: "Customers",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Create Customers",
          url: "#",
        },
        {
          title: "Display Customers",
          url: "#",
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
          url: "#",
        },
        {
          title: "Display Suppliers",
          url: "#",
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
          url: "#",
        },
        {
          title: "Display Sales",
          url: "#",
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
          url: "#",
        },
        {
          title: "Display Purchase",
          url: "#",
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
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
