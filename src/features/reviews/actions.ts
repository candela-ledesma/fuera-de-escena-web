"use server";

import { del, put } from "@vercel/blob";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth/config";
import { requireAuthorSession } from "@/lib/auth/guards";
import { db } from "@/lib/db/client";

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, MAX_REVIEW_IMAGES, draftFormSchema, reviewFormSchema, slugify } from "./schema";
import { validateAndNormalizeContent } from "./content-validation";
import {
  deleteReview,
  findTagsByName,
  getReviewBySlugForAuthor,
  getReviewByIdForAuthor,
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
  updateReviewDraftFields,
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
    contentJson: formData.get("contentJson"),
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

/**
 * Reconstruye la lista final de imágenes en el orden exacto en que el
 * ImageUploader las mostraba al momento del submit. El uploader manda un
 * campo "imageOrder" por slot ("new" o "existing:<storagePath>"), en orden,
 * junto con los <input type="file" name="images"> de las nuevas (en ese
 * mismo orden relativo entre sí) y un "imageAlts" por slot. Esto permite
 * distinguir "no se tocaron las imágenes" (sin campo imageOrder) de "se
 * quedó sin imágenes" (imageOrder presente pero vacío), y sobre todo permite
 * saber qué imágenes existentes se borraron para poder eliminarlas.
 */
async function resolveFinalImages(
  formData: FormData,
  slug: string,
  coverIndex: number,
): Promise<{ images: { storagePath: string; altText: string; position: number; isCover: boolean }[] } | { error: string }> {
  const order = formData.getAll("imageOrder").map((entry) => String(entry));
  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const altTexts = formData.getAll("imageAlts").map((entry) => String(entry));

  if (order.length > MAX_REVIEW_IMAGES) {
    return { error: `Máximo ${MAX_REVIEW_IMAGES} imágenes.` };
  }

  for (const file of files) {
    const error = validateImageFile(file);
    if (error) return { error };
  }

  let fileIndex = 0;
  const storagePaths = await Promise.all(
    order.map(async (entry, index) => {
      if (entry === "new") {
        const file = files[fileIndex];
        fileIndex += 1;
        const blob = await put(`reviews/${slug}-${Date.now()}-${index}`, file, {
          access: "public",
          addRandomSuffix: true,
        });
        return blob.url;
      }

      return entry.slice("existing:".length);
    }),
  );

  const images = storagePaths.map((storagePath, index) => ({
    storagePath,
    altText: altTexts[index] ?? "",
    position: index + 1,
    isCover: index === coverIndex,
  }));

  return { images };
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
  const { title, venue, eventDate, categoryId, rating, contentJson, tags, coverIndex } = parsed.data;

  const validatedContent = validateAndNormalizeContent(contentJson);

  if (!validatedContent) {
    return { error: "El contenido de la crítica no es válido." };
  }

  const slug = await resolveUniqueSlug(title);
  const tagIds = await resolveTagIds(tags);

  const imagesResult = await resolveFinalImages(formData, slug, coverIndex);

  if ("error" in imagesResult) {
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
        body: validatedContent.plainText,
        contentJson: validatedContent.doc,
        slug,
      },
      tx,
    );

    if (tagIds.length > 0) {
      await replaceReviewTags(review.id, tagIds, tx);
    }

    if (imagesResult.images.length > 0) {
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

  const { title, venue, eventDate, categoryId, rating, contentJson, tags, coverIndex } = parsed.data;

  const validatedContent = validateAndNormalizeContent(contentJson);

  if (!validatedContent) {
    return { error: "El contenido de la crítica no es válido." };
  }

  const slug = existing.slug;
  const tagIds = await resolveTagIds(tags);

  const hasImageOrder = formData.has("imageOrder");
  let imagesToDelete: string[] = [];
  let finalImages: { storagePath: string; altText: string; position: number; isCover: boolean }[] | null =
    null;

  if (hasImageOrder) {
    const imagesResult = await resolveFinalImages(formData, slug, coverIndex);

    if ("error" in imagesResult) {
      return { error: imagesResult.error };
    }

    const previousImages = await getReviewImages(existing.id);
    const keptPaths = new Set(imagesResult.images.map((image) => image.storagePath));
    imagesToDelete = previousImages
      .map((image) => image.storagePath)
      .filter((storagePath) => !keptPaths.has(storagePath));
    finalImages = imagesResult.images;
  }

  await db.transaction(async (tx) => {
    if (finalImages) {
      await replaceReviewImages(existing.id, finalImages, tx);
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
        body: validatedContent.plainText,
        contentJson: validatedContent.doc,
        slug,
      },
      tx,
    );

    await replaceReviewTags(existing.id, tagIds, tx);
  });

  if (imagesToDelete.length > 0) {
    await Promise.all(imagesToDelete.map((storagePath) => del(storagePath)));
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

export type SaveDraftResult = { id: string; slug: string; savedAt: string } | { error: string };

/**
 * Autosave: no hace revalidatePath ni redirect (no navega), y usa un
 * schema parcial porque un borrador puede estar incompleto. No toca
 * imágenes ni el estado publicado/despublicado de una crítica existente.
 */
export async function saveDraftAction(
  reviewId: string | null,
  formData: FormData,
): Promise<SaveDraftResult> {
  const parsed = draftFormSchema.safeParse({
    title: formData.get("title") || undefined,
    venue: formData.get("venue") || undefined,
    eventDate: formData.get("eventDate") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    rating: formData.get("rating") || undefined,
    contentJson: formData.get("contentJson") || undefined,
    tags: formData.get("tags") || undefined,
  });

  if (!parsed.success) {
    return { error: "No se pudo guardar el borrador." };
  }

  const { authorId } = await requireAuthorSession();
  const { title, venue, eventDate, categoryId, rating, contentJson, tags } = parsed.data;

  let body = "";
  let normalizedContentJson: unknown = null;

  if (contentJson) {
    const validatedContent = validateAndNormalizeContent(contentJson);

    if (!validatedContent) {
      return { error: "No se pudo guardar el borrador." };
    }

    body = validatedContent.plainText;
    normalizedContentJson = validatedContent.doc;
  }

  const fields = {
    title,
    venue: venue ?? null,
    eventDate: eventDate ?? null,
    categoryId: categoryId ?? null,
    rating: rating ?? null,
    body,
    contentJson: normalizedContentJson,
  };

  if (reviewId) {
    const existing = await getReviewByIdForAuthor(reviewId, authorId);

    if (!existing) {
      return { error: "El borrador no existe." };
    }

    const updated = await updateReviewDraftFields(reviewId, authorId, fields);

    if (!updated) {
      return { error: "No se pudo guardar el borrador." };
    }

    const tagIds = await resolveTagIds(tags);
    await replaceReviewTags(reviewId, tagIds);

    return { id: updated.id, slug: updated.slug, savedAt: updated.updatedAt.toISOString() };
  }

  const slug = await resolveUniqueSlug(title || "sin-titulo");
  const tagIds = await resolveTagIds(tags);

  const created = await insertReview({
    authorId,
    title: title || "Sin título",
    venue: fields.venue,
    eventDate: fields.eventDate,
    categoryId: fields.categoryId,
    rating: fields.rating,
    body,
    contentJson: normalizedContentJson,
    slug,
  });

  if (tagIds.length > 0) {
    await replaceReviewTags(created.id, tagIds);
  }

  return { id: created.id, slug: created.slug, savedAt: new Date().toISOString() };
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
