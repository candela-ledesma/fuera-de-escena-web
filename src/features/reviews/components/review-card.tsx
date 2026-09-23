import Link from "next/link";

import type { PublishedReviewItem } from "@/features/reviews/queries";
import { cn, formatEventDate, formatPublishedDate, reviewPublicPath } from "@/lib/utils";

import { Byline } from "./byline";
import { CoverImage } from "./cover-image";
import { RatingStars } from "./rating-stars";

const CARD_IMAGE_SIZES = "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 400px";

function cardKicker(kind: "critica" | "entrevista", item: PublishedReviewItem): string | null {
  if (kind === "entrevista") {
    return ["Entrevista", formatPublishedDate(item.publishedAt, "short")].filter(Boolean).join(" · ");
  }

  const parts = [item.venue, formatEventDate(item.eventDate, "short")].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function ReviewCard({
  item,
  kind,
  headingLevel: Heading = "h3",
}: {
  item: PublishedReviewItem;
  kind: "critica" | "entrevista";
  headingLevel?: "h2" | "h3";
}) {
  const kicker = cardKicker(kind, item);

  return (
    // Toda la card es clickeable con un solo link (el del título, estirado con
    // ::after), para no duplicar links para lectores de pantalla.
    <article
      data-testid="review-card"
      className="group relative flex flex-col rounded-[4px] outline-offset-4 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-primary"
    >
      <CoverImage src={item.coverImageUrl} alt={item.coverImageAlt ?? ""} sizes={CARD_IMAGE_SIZES} />

      {kicker ? (
        <p className="mt-5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-muted">{kicker}</p>
      ) : null}

      <Heading
        className={cn(
          "font-display text-[1.625rem] font-medium leading-tight text-foreground",
          kicker ? "mt-2" : "mt-5",
        )}
      >
        <Link
          href={reviewPublicPath(kind, item.slug)}
          className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-hover:text-primary"
        >
          {item.title}
        </Link>
      </Heading>

      <Byline name={item.authorName} className="mt-1 text-base" />

      {kind === "critica" && item.rating ? <RatingStars rating={item.rating} className="mt-3" /> : null}

      {item.summary ? (
        <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-relaxed text-muted-strong">{item.summary}</p>
      ) : null}
    </article>
  );
}
