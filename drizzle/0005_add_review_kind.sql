CREATE TYPE "public"."review_kind" AS ENUM('critica', 'entrevista');--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "kind" "review_kind" DEFAULT 'critica' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_reviews_kind_status" ON "reviews" USING btree ("kind","status","published_at");