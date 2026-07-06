import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublishedReviewBySlug, getReviewTagNames } from "@/features/reviews/queries";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const review = await getPublishedReviewBySlug(slug);

  if (!review) {
    return { title: "Crítica no encontrada" };
  }

  return {
    title: review.title,
    description: review.body.slice(0, 160),
  };
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const review = await getPublishedReviewBySlug(slug);

  if (!review) {
    notFound();
  }

  const tagNames = await getReviewTagNames(review.id);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-[60px] max-w-[720px] items-center px-6">
          <Link href="/" className="font-display text-lg font-semibold tracking-[0.03em] text-foreground no-underline">
            Fuera de Escena
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-6 py-10">
        {review.categoryName ? (
          <span className="mb-3 inline-block rounded-sm bg-primary px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-primary-foreground">
            {review.categoryName}
          </span>
        ) : null}

        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {review.title}
        </h1>

        <p className="mt-2 text-sm italic text-muted">
          {[review.venue, review.eventDate].filter(Boolean).join(" · ")}
        </p>

        {review.rating ? (
          <p className="mt-3 text-lg tracking-[2px] text-primary">{"★".repeat(review.rating)}</p>
        ) : null}

        <div className="mt-8 whitespace-pre-wrap font-display text-lg leading-8 text-foreground">
          {review.body}
        </div>

        {tagNames.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
            {tagNames.map((name) => (
              <span
                key={name}
                className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        ) : null}
      </main>

      <footer className="mt-12 flex flex-col items-center gap-2 border-t border-border px-8 py-8 text-center">
        <div className="text-xs tracking-[0.12em] text-muted">FUERA DE ESCENA BB · @FUERADEESCENABB</div>
      </footer>
    </div>
  );
}
