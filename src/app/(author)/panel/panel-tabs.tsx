"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/panel", label: "Críticas teatrales" },
  { href: "/panel/entrevistas", label: "Entrevistas" },
];

export function PanelTabs() {
  const pathname = usePathname();

  const isListingRoute = pathname === "/panel" || pathname === "/panel/entrevistas";

  if (!isListingRoute) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 border-b border-border px-3 sm:px-6">
      {TABS.map((tab) => {
        const isActive = tab.href === "/panel" ? pathname === "/panel" : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
