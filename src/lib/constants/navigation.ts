import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Building2,
  Church,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  MapPinned,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  Users,
  Wallet,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const centralNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/central/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Carte des cellules",
    href: "/central/map",
    icon: MapPinned,
  },
  {
    label: "Cellules",
    href: "/central/cells",
    icon: Church,
  },
  {
    label: "Pasteurs",
    href: "/central/pastors",
    icon: UserRoundCheck,
  },
  {
    label: "Activités",
    href: "/central/activities",
    icon: Activity,
  },
  {
    label: "Rapports",
    href: "/central/reports",
    icon: FileText,
  },
  {
    label: "Finances",
    href: "/central/finances",
    icon: Wallet,
  },
  {
    label: "Validations",
    href: "/central/validations",
    icon: ClipboardCheck,
  },
  {
    label: "Patrimoine",
    href: "/central/assets",
    icon: Building2,
  },
  {
    label: "Serviteurs",
    href: "/central/servants",
    icon: ShieldCheck,
  },
  {
    label: "Utilisateurs",
    href: "/central/users",
    icon: Users,
  },
  {
    label: "Notifications",
    href: "/central/notifications",
    icon: Bell,
  },
  {
    label: "Paramètres",
    href: "/central/settings",
    icon: Settings,
  },
];

export const cellNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/cell/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Activités",
    href: "/cell/activities",
    icon: Activity,
  },
  {
    label: "Finances",
    href: "/cell/finances",
    icon: Wallet,
  },
  {
    label: "Rapports",
    href: "/cell/reports",
    icon: FileText,
  },
];

// Compatibilité si un ancien fichier importe encore navigationItems
export const navigationItems = centralNavigation;