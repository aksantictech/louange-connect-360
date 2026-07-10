"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NavigationItem } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";

type SidebarProps = {
  navigation: NavigationItem[];
  title: string;
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({
  navigation,
  title,
  open,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition lg:hidden",
          open ? "block" : "hidden"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/10 bg-[var(--louange-purple-dark)] text-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-24 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow">
<Image
  src="/logo-louange.png"
  alt="Logo Église La Louange"
  width={40}
  height={40}
  className="h-full w-full object-contain louange-logo-animated"
  priority
/>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-lg font-black leading-tight tracking-tight">
              Louange Connect
            </div>
            <div className="text-sm font-semibold text-[var(--louange-gold)]">
              360 · {title}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/80 hover:bg-white/10 lg:hidden"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="h-[calc(100vh-6rem)] overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-[var(--louange-gold)] text-black shadow-lg"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}