import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { reactions, reviews } from "@/lib/db/schema";

import type { REACTION_TYPES } from "./schema";

type ReactionType = (typeof REACTION_TYPES)[number];

export async function isReviewPublished(reviewId: string) {
  const [review] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.status, "published")))
    .limit(1);

  return Boolean(review);
}

export async function getReactionCountsByReviewId(reviewId: string) {
  const rows = await db
    .select({ type: reactions.type, count: sql<number>`count(*)` })
    .from(reactions)
    .where(eq(reactions.reviewId, reviewId))
    .groupBy(reactions.type);

  return Object.fromEntries(rows.map((row) => [row.type, Number(row.count)])) as Partial<
    Record<ReactionType, number>
  >;
}

export async function getAnonReactionByReviewId(reviewId: string, anonId: string) {
  const [row] = await db
    .select({ type: reactions.type })
    .from(reactions)
    .where(and(eq(reactions.reviewId, reviewId), eq(reactions.anonId, anonId)))
    .limit(1);

  return row?.type ?? null;
}

export async function deleteReactionByReviewAndAnon(reviewId: string, anonId: string) {
  await db.delete(reactions).where(and(eq(reactions.reviewId, reviewId), eq(reactions.anonId, anonId)));
}

export async function setReaction(reviewId: string, type: ReactionType, anonId: string) {
  await db
    .insert(reactions)
    .values({ reviewId, type, anonId })
    .onConflictDoUpdate({
      target: [reactions.reviewId, reactions.anonId],
      set: { type },
    });
}
