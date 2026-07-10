import AppShell from "@/components/layout/AppShell";
import CellAccessGuard from "@/components/auth/CellAccessGuard";

export default function CellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CellAccessGuard>
      <AppShell variant="cell">{children}</AppShell>
    </CellAccessGuard>
  );
}