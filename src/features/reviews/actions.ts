"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth/config";

import { reviewFormSchema, slugify } from "./schema";
import {
  deleteReview,
  findTagsByName,
  getReviewBySlugForAuthor,
  insertReview,
  insertTags,
  replaceReviewTags,
  slugExists,
  updateReview,
} from "./queries";

export type ReviewFormState = {
  error?: string;
};

async function getAuthenticatedAuthor() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return { authorId: session.user.id };
}

async function resolveUniqueSlug(
  supabase: Awaited<ReturnType<typeof getServerSupabaseClient>>,
  title: string,
  excludeReviewId?: string,
) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;

  while (await slugExists(supabase, candidate, excludeReviewId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function resolveTagIds(
  supabase: Awaited<ReturnType<typeof getServerSupabaseClient>>,
  tagNames: string[],
) {
  if (tagNames.length === 0) return [];

  const existing = await findTagsByName(supabase, tagNames);
  const existingNames = new Set(existing.map((tag) => tag.name));
  const missingNames = tagNames.filter((name) => !existingNames.has(name));

  const created = await insertTags(
    supabase,
    missingNames.map((name) => ({ name, slug: slugify(name) })),
  );

  return [...existing, ...created].map((tag) => tag.id);
}

function parseForm(formData: FormData) {
  return reviewFormSchema.safeParse({
    title: formData.get("title"),
    venue: formData.get("venue") || undefined,
    eventDate: formData.get("eventDate") || undefined,
    categoryId: formData.get("categoryId"),
    rating: formData.get("rating"),
    body: formData.get("body"),
    tags: formData.get("tags") || undefined,
  });
}

export async function createReview(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const parsed = parseForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { supabase, authorId } = await getAuthenticatedAuthor();
  const { title, venue, eventDate, categoryId, rating, body, tags } = parsed.data;

  const slug = await resolveUniqueSlug(supabase, title);
  const tagIds = await resolveTagIds(supabase, tags);

  const review = await insertReview(supabase, {
    author_id: authorId,
    title,
    venue: venue ?? null,
    event_date: eventDate ?? null,
    category_id: categoryId,
    rating,
    body,
    slug,
  });

  if (tagIds.length > 0) {
    await replaceReviewTags(supabase, review.id, tagIds);
  }

  revalidatePath("/panel");
  redirect("/panel");
}

export async function updateReviewAction(
  reviewSlug: string,
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const parsed = parseForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { supabase, authorId } = await getAuthenticatedAuthor();
  const existing = await getReviewBySlugForAuthor(supabase, reviewSlug, authorId);

  if (!existing) {
    return { error: "La crítica no existe." };
  }

  const { title, venue, eventDate, categoryId, rating, body, tags } = parsed.data;

  const slug =
    title === existing.title ? existing.slug : await resolveUniqueSlug(supabase, title, existing.id);
  const tagIds = await resolveTagIds(supabase, tags);

  await updateReview(supabase, existing.id, {
    title,
    venue: venue ?? null,
    event_date: eventDate ?? null,
    category_id: categoryId,
    rating,
    body,
    slug,
  });

  await replaceReviewTags(supabase, existing.id, tagIds);

  revalidatePath("/panel");
  redirect("/panel");
}

export async function deleteReviewAction(reviewSlug: string): Promise<void> {
  const { supabase, authorId } = await getAuthenticatedAuthor();
  const existing = await getReviewBySlugForAuthor(supabase, reviewSlug, authorId);

  if (!existing) {
    return;
  }

  await deleteReview(supabase, existing.id);
  revalidatePath("/panel");
}

export async function setReviewStatusAction(
  reviewSlug: string,
  status: "draft" | "published",
): Promise<void> {
  const { supabase, authorId } = await getAuthenticatedAuthor();
  const existing = await getReviewBySlugForAuthor(supabase, reviewSlug, authorId);

  if (!existing) {
    return;
  }

  await updateReview(supabase, existing.id, {
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  });

  revalidatePath("/panel");
}
