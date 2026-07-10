"use client";

import Image from "next/image";
import { Bell, Menu, Search } from "lucide-react";
import UserMenu from "@/components/layout/UserMenu";

type TopbarProps = {
  title: string;
  onOpenSidebar: () => void;
};

export default function Topbar({ title, onOpenSidebar }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-700 shadow-sm lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu size={21} />
          </button>

          <div className="hidden h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/10 sm:flex">
            <Image
              src="/logo-louange.png"
              alt="Logo Église La Louange"
              width={40}
              height={40}
              className="h-full w-full object-contain louange-logo-animated"
              priority
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--louange-purple)]">
              Louange Connect 360
            </p>
            <h1 className="text-lg font-black text-gray-950">{title}</h1>
          </div>
        </div>

        <div className="hidden min-w-[280px] max-w-md flex-1 items-center rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 md:flex">
          <Search size={18} className="text-gray-400" />
          <input
            type="search"
            placeholder="Rechercher une cellule, un rapport..."
            className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative rounded-2xl border border-gray-200 bg-white p-2 text-gray-700 shadow-sm"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--louange-danger)]" />
          </button>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}