"use server";

import { del, put } from "@vercel/blob";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth/config";

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, MAX_REVIEW_IMAGES, reviewFormSchema, slugify } from "./schema";
import {
  deleteReview,
  findTagsByName,
  getReviewBySlugForAuthor,
  getReviewImages,
  insertReview,
  insertTags,
  replaceReviewImages,
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

async function resolveNewImages(formData: FormData, slug: string) {
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

  const uploaded = await Promise.all(
    files.map(async (file, index) => {
      const blob = await put(`reviews/${slug}-${Date.now()}-${index}`, file, {
        access: "public",
        addRandomSuffix: true,
      });

      return { storagePath: blob.url, altText: altTexts[index] ?? "", position: index + 1 };
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

  const { authorId } = await getAuthenticatedAuthor();
  const { title, venue, eventDate, categoryId, rating, body, tags } = parsed.data;

  const slug = await resolveUniqueSlug(title);
  const tagIds = await resolveTagIds(tags);

  const imagesResult = await resolveNewImages(formData, slug);

  if (imagesResult.error) {
    return { error: imagesResult.error };
  }

  const review = await insertReview({
    authorId,
    title,
    venue: venue ?? null,
    eventDate: eventDate ?? null,
    categoryId,
    rating,
    body,
    slug,
  });

  if (tagIds.length > 0) {
    await replaceReviewTags(review.id, tagIds);
  }

  if (imagesResult.images && imagesResult.images.length > 0) {
    await replaceReviewImages(review.id, imagesResult.images);
  }

  revalidatePath("/panel");
  revalidatePath("/");
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

  const { authorId } = await getAuthenticatedAuthor();
  const existing = await getReviewBySlugForAuthor(reviewSlug, authorId);

  if (!existing) {
    return { error: "La crítica no existe." };
  }

  const { title, venue, eventDate, categoryId, rating, body, tags } = parsed.data;

  const slug = title === existing.title ? existing.slug : await resolveUniqueSlug(title, existing.id);
  const tagIds = await resolveTagIds(tags);

  const newFiles = formData.getAll("images").filter((entry) => entry instanceof File && entry.size > 0);

  if (newFiles.length > 0) {
    const imagesResult = await resolveNewImages(formData, slug);

    if (imagesResult.error) {
      return { error: imagesResult.error };
    }

    const previousImages = await getReviewImages(existing.id);
    await Promise.all(previousImages.map((image) => del(image.storagePath)));
    await replaceReviewImages(existing.id, imagesResult.images ?? []);
  }

  await updateReview(existing.id, {
    title,
    venue: venue ?? null,
    eventDate: eventDate ?? null,
    categoryId,
    rating,
    body,
    slug,
  });

  await replaceReviewTags(existing.id, tagIds);

  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/critica/${slug}`);
  redirect("/panel");
}

export async function deleteReviewAction(reviewSlug: string): Promise<void> {
  const { authorId } = await getAuthenticatedAuthor();
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
  const { authorId } = await getAuthenticatedAuthor();
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
