import { SITE } from "@/lib/site-config";

import { Container } from "./container";

export function TaglineBar() {
  return (
    <div className="border-b border-border">
      <Container className="flex flex-col gap-1 py-4 sm:min-h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
        <p className="font-display text-lg italic text-muted-strong sm:text-xl">{SITE.tagline}</p>
        <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-muted">{SITE.location}</p>
      </Container>
    </div>
  );
}
