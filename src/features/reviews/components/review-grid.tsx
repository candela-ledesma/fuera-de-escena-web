import type { PublishedReviewItem } from "@/features/reviews/queries";

import { ReviewCard } from "./review-card";

/** 1 columna en mobile, 2 en tablet, 3 en desktop. */
export function ReviewGrid({
  items,
  kind,
  headingLevel,
  labelledBy,
}: {
  items: PublishedReviewItem[];
  kind: "critica" | "entrevista";
  headingLevel?: "h2" | "h3";
  labelledBy?: string;
}) {
  return (
    <ul aria-labelledby={labelledBy} className="grid gap-x-12 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          <ReviewCard item={item} kind={kind} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
