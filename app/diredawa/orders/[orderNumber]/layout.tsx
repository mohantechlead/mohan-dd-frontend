"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/authProvider";

export default function OrderDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();

  // Store can access Loading Instruction only; block other order detail pages
  const isLoadingInstruction = pathname?.includes("/loading-instruction");

  useEffect(() => {
    if (auth?.isStore && !isLoadingInstruction) {
      router.replace("/");
    }
  }, [auth?.isStore, router, isLoadingInstruction]);

  if (auth?.isStore && !isLoadingInstruction) {
    return null;
  }

  return <>{children}</>;
}
