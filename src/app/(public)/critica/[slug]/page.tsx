import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { CommentForm } from "@/features/comments/components/comment-form";
import { CommentList } from "@/features/comments/components/comment-list";
import { getApprovedCommentsByReviewId } from "@/features/comments/queries";
import { ReactionButtons } from "@/features/reactions/components/reaction-buttons";
import { ANON_ID_COOKIE } from "@/features/reactions/schema";
import { getAnonReactionByReviewId, getReactionCountsByReviewId } from "@/features/reactions/queries";
import {
  getPublishedReviewBySlug,
  getReviewImagesForDisplay,
  getReviewTagNames,
} from "@/features/reviews/queries";
import { ViewTracker } from "@/features/reviews/components/view-tracker";
import { ReviewContent } from "@/components/review-content";

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

  const cookieStore = await cookies();
  const anonId = cookieStore.get(ANON_ID_COOKIE)?.value;

  const [tagNames, images, comments, session, reactionCounts] = await Promise.all([
    getReviewTagNames(review.id),
    getReviewImagesForDisplay(review.id),
    getApprovedCommentsByReviewId(review.id),
    auth(),
    getReactionCountsByReviewId(review.id),
  ]);
  const canModerate = Boolean(session?.user);
  const activeReactionType = anonId ? await getAnonReactionByReviewId(review.id, anonId) : null;

  return (
    <div className="min-h-dvh bg-background">
      <ViewTracker reviewId={review.id} />

      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-[60px] max-w-[720px] items-center px-6">
          <Button asChild variant="ghost" size="sm" className="-ml-3 px-2 text-muted hover:text-foreground sm:px-3">
            <Link href="/" aria-label="Volver a inicio">
              <ArrowLeft />
              <span className="hidden sm:inline">Volver a inicio</span>
            </Link>
          </Button>
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

        {images.length > 0 ? (
          <div className={`mt-6 grid gap-3 ${images.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {images.map((image) => (
              <Image
                key={image.id}
                src={image.storagePath}
                alt={image.altText ?? ""}
                width={640}
                height={480}
                className="w-full rounded-md border border-border object-cover"
              />
            ))}
          </div>
        ) : null}

        <div className="mt-8">
          <ReviewContent contentJson={review.contentJson} />
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <ReactionButtons
            reviewId={review.id}
            reviewSlug={review.slug}
            counts={reactionCounts}
            activeType={activeReactionType}
          />
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

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="font-display text-xl font-semibold text-foreground">Comentarios</h2>

          <div className="mt-4">
            <CommentList comments={comments} canModerate={canModerate} />
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <CommentForm reviewSlug={review.slug} />
          </div>
        </section>
      </main>

      <footer className="mt-12 flex flex-col items-center gap-2 border-t border-border px-8 py-8 text-center">
        <div className="text-xs tracking-[0.12em] text-muted">FUERA DE ESCENA BB · @FUERADEESCENABB</div>
      </footer>
    </div>
  );
}
