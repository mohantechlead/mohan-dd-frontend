"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "../../components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar";
import { useAuth } from "../../components/authProvider";

const STORE_ALLOWED_PATHS = [
  "/diredawa/loading-instructions/authorized",
  "/diredawa/inventory/grn/create",
  "/diredawa/inventory/grn/display",
  "/diredawa/inventory/dn/create",
  "/diredawa/inventory/dn/display",
];

function isStorePathAllowed(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname.includes("/loading-instruction")) return true;
  return STORE_ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (auth?.isStore && !isStorePathAllowed(pathname)) {
      router.replace("/");
    }
  }, [auth?.isStore, pathname, router]);

  if (auth?.isStore && !isStorePathAllowed(pathname)) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="print:hidden">
        <AppSidebar />
      </div>

      <SidebarInset>
        {/* Header - hidden when printing so output starts from document logo */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 print:hidden">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>

        {/* Page Content - no print layout changes; print exactly what's on screen (sidebar/header hidden via print:hidden above) */}
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
