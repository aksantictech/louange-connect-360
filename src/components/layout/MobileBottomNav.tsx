"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationItem } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";

type MobileBottomNavProps = {
  navigation: NavigationItem[];
};

export default function MobileBottomNav({
  navigation,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-2 py-2 shadow-2xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl px-1 py-2 text-[11px] font-bold transition",
                active
                  ? "bg-[var(--louange-purple)] text-white"
                  : "text-gray-500"
              )}
            >
              <Icon size={19} />
              <span className="mt-1 line-clamp-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}