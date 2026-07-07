import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { comments, reviews } from "@/lib/db/schema";

export async function getApprovedCommentsByReviewId(reviewId: string) {
  return db
    .select({
      id: comments.id,
      authorName: comments.authorName,
      body: comments.body,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(and(eq(comments.reviewId, reviewId), eq(comments.status, "approved")))
    .orderBy(asc(comments.createdAt));
}

export async function getPublishedReviewIdBySlug(slug: string) {
  const [review] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.slug, slug), eq(reviews.status, "published")))
    .limit(1);

  return review?.id ?? null;
}

export async function insertComment(comment: typeof comments.$inferInsert) {
  const [created] = await db.insert(comments).values(comment).returning({ id: comments.id });

  return created;
}

export async function getCommentReviewSlug(commentId: string) {
  const [row] = await db
    .select({ slug: reviews.slug })
    .from(comments)
    .innerJoin(reviews, eq(comments.reviewId, reviews.id))
    .where(eq(comments.id, commentId))
    .limit(1);

  return row?.slug ?? null;
}

export async function deleteComment(commentId: string) {
  await db.delete(comments).where(eq(comments.id, commentId));
}
