"use server";

import { del, put } from "@vercel/blob";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth/config";
import { requireAuthorSession } from "@/lib/auth/guards";
import { db } from "@/lib/db/client";

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, MAX_REVIEW_IMAGES, reviewFormSchema, slugify } from "./schema";
import {
  deleteReview,
  findTagsByName,
  getReviewBySlugForAuthor,
  getReviewImages,
  incrementReviewViewCount,
  insertReview,
  insertTags,
  isReviewPublished,
  replaceReviewImages,
  replaceReviewTags,
  setCoverImageByPosition,
  slugExists,
  updateReview,
} from "./queries";

export type ReviewFormState = {
  error?: string;
};

async function resolveUniqueSlug(title: string, excludeReviewId?: string) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;

  while (await slugExists(candidate, excludeReviewId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function resolveTagIds(tagNames: string[]) {
  if (tagNames.length === 0) return [];

  const existing = await findTagsByName(tagNames);
  const existingNames = new Set(existing.map((tag) => tag.name));
  const missingNames = tagNames.filter((name) => !existingNames.has(name));

  const created = await insertTags(missingNames.map((name) => ({ name, slug: slugify(name) })));

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
    coverIndex: formData.get("coverIndex") || undefined,
  });
}

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Las imágenes deben ser JPG, PNG o WEBP.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Cada imagen debe pesar menos de 5MB.";
  }

  return null;
}

async function resolveNewImages(formData: FormData, slug: string, coverIndex: number) {
  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const altTexts = formData.getAll("imageAlts").map((entry) => String(entry));

  if (files.length > MAX_REVIEW_IMAGES) {
    return { error: `Máximo ${MAX_REVIEW_IMAGES} imágenes.` };
  }

  for (const file of files) {
    const error = validateImageFile(file);
    if (error) return { error };
  }

  const resolvedCoverIndex = coverIndex < files.length ? coverIndex : 0;

  const uploaded = await Promise.all(
    files.map(async (file, index) => {
      const blob = await put(`reviews/${slug}-${Date.now()}-${index}`, file, {
        access: "public",
        addRandomSuffix: true,
      });

      return {
        storagePath: blob.url,
        altText: altTexts[index] ?? "",
        position: index + 1,
        isCover: index === resolvedCoverIndex,
      };
    }),
  );

  return { images: uploaded };
}

export async function createReview(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const parsed = parseForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { authorId } = await requireAuthorSession();
  const { title, venue, eventDate, categoryId, rating, body, tags, coverIndex } = parsed.data;

  const slug = await resolveUniqueSlug(title);
  const tagIds = await resolveTagIds(tags);

  const imagesResult = await resolveNewImages(formData, slug, coverIndex);

  if (imagesResult.error) {
    return { error: imagesResult.error };
  }

  await db.transaction(async (tx) => {
    const review = await insertReview(
      {
        authorId,
        title,
        venue: venue ?? null,
        eventDate: eventDate ?? null,
        categoryId,
        rating,
        body,
        slug,
      },
      tx,
    );

    if (tagIds.length > 0) {
      await replaceReviewTags(review.id, tagIds, tx);
    }

    if (imagesResult.images && imagesResult.images.length > 0) {
      await replaceReviewImages(review.id, imagesResult.images, tx);
    }
  });

  revalidatePath("/panel");
  revalidatePath("/");
  redirect("/panel?saved=created");
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

  const { authorId } = await requireAuthorSession();
  const existing = await getReviewBySlugForAuthor(reviewSlug, authorId);

  if (!existing) {
    return { error: "La crítica no existe." };
  }

  const { title, venue, eventDate, categoryId, rating, body, tags, coverIndex } = parsed.data;

  const slug = title === existing.title ? existing.slug : await resolveUniqueSlug(title, existing.id);
  const tagIds = await resolveTagIds(tags);

  const newFiles = formData.getAll("images").filter((entry) => entry instanceof File && entry.size > 0);
  let newImages: { storagePath: string; altText: string; position: number; isCover: boolean }[] | null =
    null;
  let previousImageStoragePaths: string[] = [];

  if (newFiles.length > 0) {
    const imagesResult = await resolveNewImages(formData, slug, coverIndex);

    if (imagesResult.error) {
      return { error: imagesResult.error };
    }

    const previousImages = await getReviewImages(existing.id);
    previousImageStoragePaths = previousImages.map((image) => image.storagePath);
    newImages = imagesResult.images ?? [];
  }

  await db.transaction(async (tx) => {
    if (newImages) {
      await replaceReviewImages(existing.id, newImages, tx);
    } else {
      await setCoverImageByPosition(existing.id, coverIndex + 1, tx);
    }

    await updateReview(
      existing.id,
      {
        title,
        venue: venue ?? null,
        eventDate: eventDate ?? null,
        categoryId,
        rating,
        body,
        slug,
      },
      tx,
    );

    await replaceReviewTags(existing.id, tagIds, tx);
  });

  if (previousImageStoragePaths.length > 0) {
    await Promise.all(previousImageStoragePaths.map((storagePath) => del(storagePath)));
  }

  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/critica/${slug}`);
  redirect("/panel?saved=updated");
}

export async function deleteReviewAction(reviewSlug: string): Promise<void> {
  const { authorId } = await requireAuthorSession();
  const existing = await getReviewBySlugForAuthor(reviewSlug, authorId);

  if (!existing) {
    return;
  }

  const images = await getReviewImages(existing.id);
  await Promise.all(images.map((image) => del(image.storagePath)));

  await deleteReview(existing.id);
  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/critica/${reviewSlug}`);
}

export async function setReviewStatusAction(
  reviewSlug: string,
  status: "draft" | "published",
): Promise<void> {
  const { authorId } = await requireAuthorSession();
  const existing = await getReviewBySlugForAuthor(reviewSlug, authorId);

  if (!existing) {
    return;
  }

  await updateReview(existing.id, {
    status,
    publishedAt: status === "published" ? new Date() : null,
  });

  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/critica/${reviewSlug}`);
}

const VIEW_DEDUPE_WINDOW_SECONDS = 60 * 60 * 24;

/**
 * Mutación pública: la puede llamar cualquier visitante anónimo.
 * Solo incrementa; no acepta ni devuelve nada sensible. Deduplicada por
 * cookie opaca (sin PII) de 24h, y no cuenta vistas de la propia autora.
 */
export async function incrementReviewView(reviewId: string): Promise<void> {
  const session = await auth();

  if (session?.user) {
    return;
  }

  const published = await isReviewPublished(reviewId);

  if (!published) {
    return;
  }

  const cookieStore = await cookies();
  const cookieName = `viewed_${reviewId}`;

  if (cookieStore.get(cookieName)) {
    return;
  }

  await incrementReviewViewCount(reviewId);

  cookieStore.set(cookieName, "1", {
    maxAge: VIEW_DEDUPE_WINDOW_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}
