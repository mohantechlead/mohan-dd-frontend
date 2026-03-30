"use client";

import React, { useEffect, useState } from "react";
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
  "/diredawa/inventory/grn", // allows /grn/[grnNo] detail
  "/diredawa/inventory/dn/create",
  "/diredawa/inventory/dn/display",
  "/diredawa/inventory/dn", // allows /dn/[dnNo] detail
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
  /** Avoid SSR→client hydration mismatches when extensions inject attrs (e.g. fdprocessedid on inputs). */
  const [workspaceReady, setWorkspaceReady] = useState(false);

  useEffect(() => {
    setWorkspaceReady(true);
  }, []);

  useEffect(() => {
    if (auth?.isStore && !isStorePathAllowed(pathname)) {
      router.replace("/");
    }
  }, [auth?.isStore, pathname, router]);

  if (auth?.isStore && !isStorePathAllowed(pathname)) {
    return null;
  }

  if (!workspaceReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <span className="text-sm text-muted-foreground">Loading workspace…</span>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="print:hidden">
        <AppSidebar />
      </div>

      <SidebarInset>
        {/* Header - hidden when printing so output starts from document logo */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 print:hidden">
          <div className="flex w-full items-center gap-3 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-6 w-px bg-border" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">Mohan PLC</div>
              <div className="truncate text-xs text-muted-foreground">Dire Dawa</div>
            </div>
          </div>
        </header>

        {/* Page Content - no print layout changes; print exactly what's on screen (sidebar/header hidden via print:hidden above) */}
        <main className="min-h-[calc(100svh-4rem)] bg-muted/20">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
