import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  Church,
  ClipboardCheck,
  CreditCard,
  FileText,
  HandCoins,
  Home,
  Landmark,
  LayoutDashboard,
  MapPinned,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: any;
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
    label: "Rapports",
    href: "/central/reports",
    icon: FileText,
  },
  {
    label: "Activités",
    href: "/central/activities",
    icon: Activity,
  },
  {
    label: "Finances",
    href: "/central/finances",
    icon: HandCoins,
  },
  {
    label: "Validations",
    href: "/central/approvals",
    icon: ClipboardCheck,
  },
  {
    label: "Patrimoine",
    href: "/central/assets",
    icon: Landmark,
  },
  {
    label: "Serviteurs",
    href: "/central/servants",
    icon: Users,
  },
  {
    label: "Départements",
    href: "/central/departments",
    icon: Building2,
  },
  {
    label: "Utilisateurs",
    href: "/central/users",
    icon: ShieldCheck,
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
    label: "Mon dashboard",
    href: "/cell/dashboard",
    icon: Home,
  },
  {
    label: "Rapport dimanche",
    href: "/cell/sunday-report",
    icon: FileText,
  },
  {
    label: "Activités",
    href: "/cell/activities",
    icon: Activity,
  },
 
  {
    label: "Finances",
    href: "/cell/finances",
    icon: CreditCard,
  },
  {
    label: "Serviteurs",
    href: "/cell/servants",
    icon: Users,
  },
  {
    label: "Départements",
    href: "/cell/departments",
    icon: Building2,
  },
  {
    label: "Patrimoine local",
    href: "/cell/assets",
    icon: Landmark,
  },
  {
    label: "Besoins",
    href: "/cell/needs",
    icon: BarChart3,
  },
  {
    label: "Notifications",
    href: "/cell/notifications",
    icon: Bell,
  },
];