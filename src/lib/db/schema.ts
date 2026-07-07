import {
  pgEnum,
  pgTable,
  uuid,
  text,
  timestamp,
  smallint,
  integer,
  date,
  boolean,
  primaryKey,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const reviewStatusEnum = pgEnum("review_status", ["draft", "published"]);
export const commentStatusEnum = pgEnum("comment_status", ["pending", "approved", "rejected"]);
export const reactionTypeEnum = pgEnum("reaction_type", ["like", "love", "wow", "applause"]);

export const authors = pgTable("authors", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => authors.id),
  categoryId: uuid("category_id").references(() => categories.id),
  title: text("title").notNull(),
  venue: text("venue"),
  eventDate: date("event_date"),
  rating: smallint("rating"),
  body: text("body").notNull(),
  slug: text("slug").notNull().unique(),
  status: reviewStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_reviews_status").on(table.status, table.publishedAt),
]);

export const reviewImages = pgTable("review_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  altText: text("alt_text"),
  position: smallint("position").notNull(),
  isCover: boolean("is_cover").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("review_images_review_id_position_unique").on(table.reviewId, table.position),
]);

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const reviewTags = pgTable("review_tags", {
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.reviewId, table.tagId] }),
]);

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  status: commentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_comments_review").on(table.reviewId, table.status),
]);

export const reactions = pgTable("reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  type: reactionTypeEnum("type").notNull(),
  anonId: text("anon_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("reactions_review_anon_unique").on(table.reviewId, table.anonId),
  index("idx_reactions_review").on(table.reviewId),
]);
