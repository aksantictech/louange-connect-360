import { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";

export default function CellLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppShell variant="cell">{children}</AppShell>;
}