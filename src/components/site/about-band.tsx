import Image from "next/image";

import { SITE } from "@/lib/site-config";

import { Container } from "./container";

export function AboutBand() {
  return (
    <Container>
      <section
        id="sobre"
        aria-labelledby="sobre-titulo"
        data-surface="dark"
        className="scroll-mt-28 flex flex-col items-start gap-8 rounded-md bg-band px-6 py-10 text-band-foreground sm:px-12 md:gap-10 md:px-12 md:py-14 lg:flex-row lg:items-center lg:gap-12 lg:px-[72px] lg:py-16"
      >
        <Image
          src="/brand/logo.png"
          alt=""
          width={132}
          height={132}
          className="size-24 shrink-0 rounded-full object-cover lg:size-[132px]"
        />

        <div className="flex-1">
          <h2 id="sobre-titulo" className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-band-accent">
            Sobre el sitio
          </h2>
          <p className="mt-3 font-display text-2xl leading-snug sm:text-[1.875rem]">{SITE.about}</p>
        </div>

        <a
          href={SITE.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-band-accent px-7 py-3 text-xs font-medium uppercase tracking-[0.18em] text-band-foreground transition-colors hover:bg-band-accent hover:text-band"
        >
          Seguir en Instagram
          <span className="sr-only"> (abre en una pestaña nueva)</span>
        </a>
      </section>
    </Container>
  );
}
