import { and, desc, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { categories, reviews, reviewTags, tags } from "@/lib/db/schema";

export async function getCategories() {
  return db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).orderBy(categories.name);
}

export async function getReviewsByAuthor(authorId: string) {
  return db
    .select({
      id: reviews.id,
      title: reviews.title,
      slug: reviews.slug,
      status: reviews.status,
      rating: reviews.rating,
      venue: reviews.venue,
      eventDate: reviews.eventDate,
      updatedAt: reviews.updatedAt,
    })
    .from(reviews)
    .where(eq(reviews.authorId, authorId))
    .orderBy(desc(reviews.updatedAt));
}

export async function getReviewBySlugForAuthor(slug: string, authorId: string) {
  const [review] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.slug, slug), eq(reviews.authorId, authorId)))
    .limit(1);

  return review ?? null;
}

export async function getReviewTagNames(reviewId: string) {
  const rows = await db
    .select({ name: tags.name })
    .from(reviewTags)
    .innerJoin(tags, eq(reviewTags.tagId, tags.id))
    .where(eq(reviewTags.reviewId, reviewId));

  return rows.map((row) => row.name);
}

export async function slugExists(slug: string, excludeReviewId?: string) {
  const conditions = excludeReviewId
    ? and(eq(reviews.slug, slug), ne(reviews.id, excludeReviewId))
    : eq(reviews.slug, slug);

  const [existing] = await db.select({ id: reviews.id }).from(reviews).where(conditions).limit(1);

  return Boolean(existing);
}

export async function insertReview(review: typeof reviews.$inferInsert) {
  const [created] = await db.insert(reviews).values(review).returning({ id: reviews.id, slug: reviews.slug });

  return created;
}

export async function updateReview(reviewId: string, review: Partial<typeof reviews.$inferInsert>) {
  await db
    .update(reviews)
    .set({ ...review, updatedAt: new Date() })
    .where(eq(reviews.id, reviewId));
}

export async function deleteReview(reviewId: string) {
  await db.delete(reviews).where(eq(reviews.id, reviewId));
}

export async function findTagsByName(names: string[]) {
  if (names.length === 0) return [];

  return db.select({ id: tags.id, name: tags.name }).from(tags).where(inArray(tags.name, names));
}

export async function insertTags(newTags: { name: string; slug: string }[]) {
  if (newTags.length === 0) return [];

  return db.insert(tags).values(newTags).returning({ id: tags.id, name: tags.name });
}

export async function replaceReviewTags(reviewId: string, tagIds: string[]) {
  await db.delete(reviewTags).where(eq(reviewTags.reviewId, reviewId));

  if (tagIds.length === 0) return;

  await db.insert(reviewTags).values(tagIds.map((tagId) => ({ reviewId, tagId })));
}
