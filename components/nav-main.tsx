"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar";

type NavSubItem = {
  title: string;
  url: string;
  items?: NavSubItem[];
};

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavSubItem[];
};

function isItemActive(pathname: string, url: string): boolean {
  if (pathname === url) return true;
  // Detail pages under "display" routes (e.g. /grn/123 → Display GRN, /orders/M103 → Display Sales)
  if (url.endsWith("/display") && pathname.startsWith(url.replace(/\/display$/, "/"))) {
    return true;
  }
  return false;
}

function hasActiveDescendant(pathname: string, items?: NavSubItem[]): boolean {
  if (!items || items.length === 0) return false;
  return items.some((it) => isItemActive(pathname, it.url) || hasActiveDescendant(pathname, it.items));
}

export function NavMain({
  items,
}: {
  items: NavItem[];
}) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasActiveChild = hasActiveDescendant(pathname, item.items);
          const isOpen =
            item.title in openSections
              ? openSections[item.title]
              : !!hasActiveChild || !!item.isActive;
          return (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, [item.title]: open }))}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const hasNested = !!subItem.items?.length;
                      if (hasNested) {
                        const nestedKey = `${item.title}::${subItem.title}`;
                        const hasActiveNested = hasActiveDescendant(pathname, subItem.items);
                        const nestedOpen =
                          nestedKey in openSections
                            ? openSections[nestedKey]
                            : hasActiveNested;
                        return (
                          <Collapsible
                            key={nestedKey}
                            asChild
                            open={nestedOpen}
                            onOpenChange={(open) =>
                              setOpenSections((prev) => ({ ...prev, [nestedKey]: open }))
                            }
                            className="group/collapsible"
                          >
                            <SidebarMenuSubItem>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuSubButton>
                                  <span>{subItem.title}</span>
                                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuSubButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenuSub className="ml-3 border-l pl-2">
                                  {subItem.items?.map((leaf) => {
                                    const nestedActive = isItemActive(pathname, leaf.url);
                                    return (
                                      <SidebarMenuSubItem key={`${nestedKey}::${leaf.title}`}>
                                        <SidebarMenuSubButton asChild isActive={nestedActive}>
                                          <Link href={leaf.url}>
                                            <span>{leaf.title}</span>
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    );
                                  })}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </SidebarMenuSubItem>
                          </Collapsible>
                        );
                      }
                      const active = isItemActive(pathname, subItem.url);
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={active}>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
