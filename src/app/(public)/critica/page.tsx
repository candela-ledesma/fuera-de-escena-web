import type { Metadata } from "next";

import { Container } from "@/components/site/container";
import { EmptyState } from "@/components/site/empty-state";
import { ReviewGrid } from "@/features/reviews/components/review-grid";
import { getPublishedReviews } from "@/features/reviews/queries";

// Sin loading.tsx en esta carpeta: envolvería a [slug] y rompería su 404.
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Críticas",
};

export default async function ReviewsListPage() {
  const items = await getPublishedReviews("critica");

  return (
    <main>
      <Container className="pt-10 md:pt-16">
        <h1 className="border-b border-foreground! pb-6 font-display text-[2.5rem] font-medium leading-tight text-foreground sm:text-5xl">
          Críticas
        </h1>

        <div className="mt-10">
          {items.length > 0 ? (
            <ReviewGrid items={items} kind="critica" headingLevel="h2" />
          ) : (
            <EmptyState message="Todavía no hay críticas publicadas." />
          )}
        </div>
      </Container>
    </main>
  );
}
