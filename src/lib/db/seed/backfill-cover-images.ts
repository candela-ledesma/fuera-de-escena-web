import { asc, eq, sql } from "drizzle-orm";

import { db } from "../client";
import { reviewImages } from "../schema";

async function backfill() {
  const reviewsWithoutCover = await db
    .selectDistinct({ reviewId: reviewImages.reviewId })
    .from(reviewImages)
    .where(
      sql`${reviewImages.reviewId} NOT IN (
        SELECT ${reviewImages.reviewId} FROM ${reviewImages} WHERE ${reviewImages.isCover} = true
      )`,
    );

  for (const { reviewId } of reviewsWithoutCover) {
    const [firstImage] = await db
      .select({ id: reviewImages.id })
      .from(reviewImages)
      .where(eq(reviewImages.reviewId, reviewId))
      .orderBy(asc(reviewImages.position))
      .limit(1);

    if (firstImage) {
      await db.update(reviewImages).set({ isCover: true }).where(eq(reviewImages.id, firstImage.id));
    }
  }

  console.log(`Backfill completo: ${reviewsWithoutCover.length} crítica(s) actualizada(s).`);
}

backfill()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
