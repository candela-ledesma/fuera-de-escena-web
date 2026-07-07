import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { categories, comments, reactions, reviewImages, reviews, reviewTags, tags } from "@/lib/db/schema";

type DbClient = typeof db | Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];

export async function getCategories() {
  return db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).orderBy(categories.name);
}

const commentsCountSql = sql<number>`(
  select count(*) from ${comments} where ${comments.reviewId} = ${reviews.id}
)`.as("commentsCount");

const reactionsCountSql = sql<number>`(
  select count(*) from ${reactions} where ${reactions.reviewId} = ${reviews.id}
)`.as("reactionsCount");

export async function getReviewsByAuthor(
  authorId: string,
  orderBy: "recent" | "popular" = "recent",
) {
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
      viewCount: reviews.viewCount,
      commentsCount: commentsCountSql,
      reactionsCount: reactionsCountSql,
      coverImageUrl: reviewImages.storagePath,
      coverImageAlt: reviewImages.altText,
    })
    .from(reviews)
    .leftJoin(reviewImages, and(eq(reviewImages.reviewId, reviews.id), eq(reviewImages.isCover, true)))
    .where(eq(reviews.authorId, authorId))
    .orderBy(orderBy === "popular" ? desc(reviews.viewCount) : desc(reviews.updatedAt));
}

export async function getAuthorReviewStats(authorId: string) {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)`,
      published: sql<number>`count(*) filter (where ${reviews.status} = 'published')`,
      drafts: sql<number>`count(*) filter (where ${reviews.status} = 'draft')`,
      totalViews: sql<number>`coalesce(sum(${reviews.viewCount}), 0)`,
    })
    .from(reviews)
    .where(eq(reviews.authorId, authorId));

  const [mostViewed] = await db
    .select({ title: reviews.title, slug: reviews.slug, viewCount: reviews.viewCount })
    .from(reviews)
    .where(eq(reviews.authorId, authorId))
    .orderBy(desc(reviews.viewCount))
    .limit(1);

  return {
    total: Number(totals?.total ?? 0),
    published: Number(totals?.published ?? 0),
    drafts: Number(totals?.drafts ?? 0),
    totalViews: Number(totals?.totalViews ?? 0),
    mostViewed: mostViewed && mostViewed.viewCount > 0 ? mostViewed : null,
  };
}

export async function getReviewBySlugForAuthor(slug: string, authorId: string) {
  const [review] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.slug, slug), eq(reviews.authorId, authorId)))
    .limit(1);

  return review ?? null;
}

export async function getPublishedReviews() {
  return db
    .select({
      id: reviews.id,
      title: reviews.title,
      slug: reviews.slug,
      venue: reviews.venue,
      eventDate: reviews.eventDate,
      rating: reviews.rating,
      publishedAt: reviews.publishedAt,
      categoryName: categories.name,
      coverImageUrl: reviewImages.storagePath,
      coverImageAlt: reviewImages.altText,
    })
    .from(reviews)
    .leftJoin(categories, eq(reviews.categoryId, categories.id))
    .leftJoin(reviewImages, and(eq(reviewImages.reviewId, reviews.id), eq(reviewImages.isCover, true)))
    .where(eq(reviews.status, "published"))
    .orderBy(desc(reviews.publishedAt));
}

export async function getPublishedReviewBySlug(slug: string) {
  const [review] = await db
    .select({
      id: reviews.id,
      title: reviews.title,
      venue: reviews.venue,
      eventDate: reviews.eventDate,
      rating: reviews.rating,
      body: reviews.body,
      slug: reviews.slug,
      publishedAt: reviews.publishedAt,
      categoryName: categories.name,
    })
    .from(reviews)
    .leftJoin(categories, eq(reviews.categoryId, categories.id))
    .where(and(eq(reviews.slug, slug), eq(reviews.status, "published")))
    .limit(1);

  return review ?? null;
}

export async function isReviewPublished(reviewId: string) {
  const [review] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.status, "published")))
    .limit(1);

  return Boolean(review);
}

export async function incrementReviewViewCount(reviewId: string) {
  await db
    .update(reviews)
    .set({ viewCount: sql`${reviews.viewCount} + 1` })
    .where(eq(reviews.id, reviewId));
}

export async function getReviewImages(reviewId: string) {
  return db
    .select({
      id: reviewImages.id,
      storagePath: reviewImages.storagePath,
      altText: reviewImages.altText,
      position: reviewImages.position,
      isCover: reviewImages.isCover,
    })
    .from(reviewImages)
    .where(eq(reviewImages.reviewId, reviewId))
    .orderBy(asc(reviewImages.position));
}

export async function getReviewImagesForDisplay(reviewId: string) {
  const images = await getReviewImages(reviewId);

  return [...images].sort((a, b) => Number(b.isCover) - Number(a.isCover));
}

export async function replaceReviewImages(
  reviewId: string,
  images: { storagePath: string; altText: string; position: number; isCover: boolean }[],
  client: DbClient = db,
) {
  await client.delete(reviewImages).where(eq(reviewImages.reviewId, reviewId));

  if (images.length === 0) return;

  await client.insert(reviewImages).values(images.map((image) => ({ reviewId, ...image })));
}

export async function setCoverImageByPosition(
  reviewId: string,
  coverPosition: number,
  client: DbClient = db,
) {
  await client
    .update(reviewImages)
    .set({ isCover: false })
    .where(eq(reviewImages.reviewId, reviewId));

  await client
    .update(reviewImages)
    .set({ isCover: true })
    .where(and(eq(reviewImages.reviewId, reviewId), eq(reviewImages.position, coverPosition)));
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

export async function insertReview(review: typeof reviews.$inferInsert, client: DbClient = db) {
  const [created] = await client
    .insert(reviews)
    .values(review)
    .returning({ id: reviews.id, slug: reviews.slug });

  return created;
}

export async function updateReview(
  reviewId: string,
  review: Partial<typeof reviews.$inferInsert>,
  client: DbClient = db,
) {
  await client
    .update(reviews)
    .set({ ...review, updatedAt: new Date() })
    .where(eq(reviews.id, reviewId));
}

export async function deleteReview(reviewId: string) {
  await db.delete(reviews).where(eq(reviews.id, reviewId));
}

export async function findTagsByName(names: string[], client: DbClient = db) {
  if (names.length === 0) return [];

  return client.select({ id: tags.id, name: tags.name }).from(tags).where(inArray(tags.name, names));
}

export async function insertTags(newTags: { name: string; slug: string }[], client: DbClient = db) {
  if (newTags.length === 0) return [];

  return client.insert(tags).values(newTags).returning({ id: tags.id, name: tags.name });
}

export async function replaceReviewTags(reviewId: string, tagIds: string[], client: DbClient = db) {
  await client.delete(reviewTags).where(eq(reviewTags.reviewId, reviewId));

  if (tagIds.length === 0) return;

  await client.insert(reviewTags).values(tagIds.map((tagId) => ({ reviewId, tagId })));
}
