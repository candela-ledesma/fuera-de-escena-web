"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MAIN_NAV, isNavItemActive } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const linkClass =
  "relative flex min-h-11 items-center text-xs font-medium uppercase tracking-[0.08em] text-foreground transition-colors hover:text-primary sm:tracking-[0.18em]";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-8 lg:gap-10">
      {MAIN_NAV.map((item) => {
        if (item.external) {
          return (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {item.label}
                <span className="sr-only"> (abre en una pestaña nueva)</span>
              </a>
            </li>
          );
        }

        const isActive = isNavItemActive(item, pathname);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                linkClass,
                isActive &&
                  "after:absolute after:inset-x-0 after:bottom-2 after:h-px after:bg-primary",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
