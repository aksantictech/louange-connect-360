"use client";

import { ReactNode, useMemo, useState } from "react";
import { centralNavigation, cellNavigation } from "@/lib/constants/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileBottomNav from "./MobileBottomNav";

type AppShellProps = {
  children: ReactNode;
  variant: "central" | "cell";
};

export default function AppShell({ children, variant }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = useMemo(() => {
    return variant === "central" ? centralNavigation : cellNavigation;
  }, [variant]);

  const title =
    variant === "central"
      ? "Espace Central"
      : "Espace Cellule";

  return (
    <div className="min-h-screen bg-[var(--louange-bg)]">
      <Sidebar
        navigation={navigation}
        title={title}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <Topbar
          title={title}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>

      <MobileBottomNav navigation={navigation.slice(0, 5)} />
    </div>
  );
}