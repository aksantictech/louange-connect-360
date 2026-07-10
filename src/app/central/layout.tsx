import { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";

export default function CentralLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppShell variant="central">{children}</AppShell>;
}