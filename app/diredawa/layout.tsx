"use client";

import React from "react";
import { AppSidebar } from "../../components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
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
