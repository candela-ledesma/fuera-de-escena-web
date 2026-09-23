"use client";

import { useState } from "react";
import Image from "next/image";

import { PublicNavTabs, type PublicTab } from "@/components/public-nav-tabs";

import { ReviewsGrid } from "./reviews-grid";

type ListItem = {
  id: string;
  title: string;
  slug: string;
  venue: string | null;
  eventDate: string | null;
  rating: number | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
};

const DESCRIPTIONS: Record<PublicTab, string> = {
  criticas: "Críticas, miradas y recomendaciones sobre teatro en Bahía Blanca y la región.",
  entrevistas: "Entrevistas y conversaciones con artistas de la escena teatral de Bahía Blanca y la región.",
};

export function ListadoTabs({
  reviews,
  interviews,
}: {
  reviews: ListItem[];
  interviews: ListItem[];
}) {
  const [active, setActive] = useState<PublicTab>("criticas");
  const count = active === "criticas" ? reviews.length : interviews.length;
  const noun =
    active === "criticas" ? (count === 1 ? "crítica" : "críticas") : count === 1 ? "entrevista" : "entrevistas";

  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-6">
          <Image
            src="/brand/logo.png"
            alt=""
            aria-hidden="true"
            width={96}
            height={96}
            className="hidden size-24 shrink-0 rounded-full border border-border object-cover sm:block"
          />
          <div>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span className="text-sm text-foreground">
                <strong className="font-semibold">{count}</strong> {noun}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground">{DESCRIPTIONS[active]}</p>
            <p className="mt-2 text-xs text-foreground/70">Bahía Blanca · Argentina</p>
          </div>
        </div>
      </section>

      <PublicNavTabs active={active} onChange={setActive} />

      <main className="mx-auto max-w-5xl px-5 py-8">
        {active === "criticas" ? (
          <ReviewsGrid items={reviews} basePath="/critica" emptyMessage="Todavía no hay críticas publicadas." />
        ) : (
          <ReviewsGrid
            items={interviews}
            basePath="/entrevista"
            emptyMessage="Todavía no hay entrevistas publicadas."
          />
        )}
      </main>
    </>
  );
}
