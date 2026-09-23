import Image from "next/image";
import Link from "next/link";

import { SITE } from "@/lib/site-config";

import { Container } from "./container";
import { NavLinks } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background md:sticky md:top-0 md:z-50">
      <Container className="flex flex-col gap-1 pt-3 sm:min-h-[88px] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-0">
        <Link href="/" className="flex min-h-11 items-center gap-3 self-start sm:self-auto">
          <Image
            src="/brand/logo.png"
            alt=""
            width={44}
            height={44}
            priority
            className="size-9 shrink-0 rounded-full object-cover sm:size-11"
          />
          <span className="font-display text-2xl font-medium text-foreground sm:text-[1.625rem]">{SITE.name}</span>
        </Link>

        <nav aria-label="Principal" className="w-full sm:w-auto">
          <NavLinks />
        </nav>
      </Container>
    </header>
  );
}
