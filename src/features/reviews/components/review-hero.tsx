import Link from "next/link";

import type { PublishedReviewItem } from "@/features/reviews/queries";
import { formatEventDate, reviewPublicPath } from "@/lib/utils";

import { Byline } from "./byline";
import { CoverImage } from "./cover-image";
import { RatingStars } from "./rating-stars";

export function ReviewHero({ review }: { review: PublishedReviewItem }) {
  const href = reviewPublicPath("critica", review.slug);
  const meta = [review.venue, formatEventDate(review.eventDate, "long")].filter(Boolean).join(" · ");

  return (
    <article data-testid="review-hero" className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
      <CoverImage
        src={review.coverImageUrl}
        alt={review.coverImageAlt ?? ""}
        sizes="(max-width: 1023px) 100vw, 680px"
        priority
        className="lg:col-span-7"
      />

      <div className="lg:col-span-5">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-primary">Última crítica</p>

        <h2 className="mt-4 font-display text-[2.5rem] font-medium leading-[1.05] text-foreground sm:text-5xl xl:text-[3.5rem]">
          <Link href={href} className="hover:text-primary">
            {review.title}
          </Link>
        </h2>

        <Byline name={review.authorName} className="mt-3 text-lg" />

        {review.rating || meta ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
            {review.rating ? <RatingStars rating={review.rating} className="text-base" /> : null}
            {meta ? <p className="text-sm text-muted-strong">{meta}</p> : null}
          </div>
        ) : null}

        {review.summary ? (
          <p className="mt-6 text-base leading-7 text-muted-strong">{review.summary}</p>
        ) : null}

        <Link
          href={href}
          className="mt-8 inline-flex min-h-11 items-center border-b-[1.5px] border-foreground! text-xs font-medium uppercase tracking-[0.18em] text-foreground hover:border-primary! hover:text-primary"
        >
          Leer crítica <span aria-hidden="true">&nbsp;→</span>
          <span className="sr-only">: {review.title}</span>
        </Link>
      </div>
    </article>
  );
}
