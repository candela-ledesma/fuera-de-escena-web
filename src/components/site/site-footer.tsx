import Link from "next/link";

import { FOOTER_NAV, SITE } from "@/lib/site-config";

import { Container } from "./container";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border md:mt-24">
      <Container className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:py-12">
        <a
          href={SITE.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center text-xs uppercase tracking-[0.18em] text-muted hover:text-primary"
        >
          {SITE.fullName} · {SITE.instagramHandle}
          <span className="sr-only"> (abre en una pestaña nueva)</span>
        </a>

        <nav aria-label="Pie de página">
          <ul className="flex flex-wrap gap-x-8 gap-y-1">
            {FOOTER_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex min-h-11 items-center text-xs text-muted hover:text-primary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
