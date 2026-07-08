import { eq, isNull } from "drizzle-orm";

import { db } from "../client";
import { reviews } from "../schema";

function textToProseMirrorDoc(text: string) {
  return {
    type: "doc",
    content: text.split(/\n+/).map((paragraph) => {
      const trimmed = paragraph.trim();
      return {
        type: "paragraph",
        content: trimmed ? [{ type: "text", text: trimmed }] : [],
      };
    }),
  };
}

async function backfill() {
  const pendingReviews = await db
    .select({ id: reviews.id, body: reviews.body })
    .from(reviews)
    .where(isNull(reviews.contentJson));

  for (const review of pendingReviews) {
    await db
      .update(reviews)
      .set({ contentJson: textToProseMirrorDoc(review.body) })
      .where(eq(reviews.id, review.id));
  }

  console.log(`Backfill completo: ${pendingReviews.length} crítica(s) actualizada(s).`);
}

backfill()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
