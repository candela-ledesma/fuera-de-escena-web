"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth/config";
import { requireAuthorSession } from "@/lib/auth/guards";
import { deleteOwnBlobs } from "@/lib/blob";
import { db } from "@/lib/db/client";

import { resolveFinalImages, resolveTagIds, resolveUniqueSlug } from "./action-helpers";
import { draftFormSchema, getPublishError, reviewFormSchema } from "./schema";
import { validateAndNormalizeContent } from "./content-validation";
import {
  deleteReview,
  getReviewBySlugForAuthor,
  getReviewByIdForAuthor,
  getReviewImages,
  incrementReviewViewCount,
  insertReview,
  isReviewPublished,
  replaceReviewImages,
  replaceReviewTags,
  setCoverImageByPosition,
  updateReview,
  updateReviewDraftFields,
} from "./queries";

export type ReviewFormState = {
  error?: string;
};

function parseForm(formData: FormData) {
  return reviewFormSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") || undefined,
    venue: formData.get("venue") || undefined,
    eventDate: formData.get("eventDate") || undefined,
    categoryId: formData.get("categoryId"),
    rating: formData.get("rating"),
    contentJson: formData.get("contentJson"),
    tags: formData.get("tags") || undefined,
    coverIndex: formData.get("coverIndex") || undefined,
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

  const { authorId } = await requireAuthorSession();
  const { title, summary, venue, eventDate, categoryId, rating, contentJson, tags, coverIndex } = parsed.data;

  const validatedContent = validateAndNormalizeContent(contentJson);

  if (!validatedContent) {
    return { error: "El contenido de la crítica no es válido." };
  }

  const slug = await resolveUniqueSlug(title);
  const tagIds = await resolveTagIds(tags);

  const imagesResult = await resolveFinalImages(formData, slug, coverIndex, "reviews");

  if ("error" in imagesResult) {
    return { error: imagesResult.error };
  }

  await db.transaction(async (tx) => {
    const review = await insertReview(
      {
        authorId,
        kind: "critica",
        title,
        summary: summary || null,
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
  const existing = await getReviewBySlugForAuthor(reviewSlug, authorId, "critica");

  if (!existing) {
    return { error: "La crítica no existe." };
  }

  const { title, summary, venue, eventDate, categoryId, rating, contentJson, tags, coverIndex } = parsed.data;

  if (existing.status === "published") {
    const publishError = getPublishError("critica", { summary, eventDate });
    if (publishError) return { error: publishError };
  }

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
    const imagesResult = await resolveFinalImages(formData, slug, coverIndex, "reviews");

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
        summary: summary || null,
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

  await deleteOwnBlobs(imagesToDelete);

  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/critica/${slug}`);
  redirect("/panel?saved=updated");
}

export async function deleteReviewAction(reviewSlug: string): Promise<void> {
  const { authorId } = await requireAuthorSession();
  const existing = await getReviewBySlugForAuthor(reviewSlug, authorId, "critica");

  if (!existing) {
    return;
  }

  const images = await getReviewImages(existing.id);
  await deleteOwnBlobs(images.map((image) => image.storagePath));

  await deleteReview(existing.id);
  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/critica/${reviewSlug}`);
}

export async function setReviewStatusAction(
  reviewSlug: string,
  status: "draft" | "published",
): Promise<{ error?: string }> {
  const { authorId } = await requireAuthorSession();
  const existing = await getReviewBySlugForAuthor(reviewSlug, authorId, "critica");

  if (!existing) {
    return { error: "La crítica no existe." };
  }

  if (status === "published") {
    const publishError = getPublishError("critica", existing);
    if (publishError) return { error: publishError };
  }

  await updateReview(existing.id, {
    status,
    publishedAt: status === "published" ? new Date() : null,
  });

  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/critica/${reviewSlug}`);

  return {};
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
    summary: formData.get("summary") || undefined,
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
  const { title, summary, venue, eventDate, categoryId, rating, contentJson, tags } = parsed.data;

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
    summary: summary || null,
    venue: venue ?? null,
    eventDate: eventDate ?? null,
    categoryId: categoryId ?? null,
    rating: rating ?? null,
    body,
    contentJson: normalizedContentJson,
  };

  if (reviewId) {
    const existing = await getReviewByIdForAuthor(reviewId, authorId, "critica");

    if (!existing) {
      return { error: "El borrador no existe." };
    }

    // El autosave también corre sobre críticas publicadas: no puede dejarlas incompletas.
    if (existing.status === "published") {
      const publishError = getPublishError("critica", fields);
      if (publishError) return { error: publishError };
    }

    const updated = await updateReviewDraftFields(reviewId, authorId, "critica", fields);

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
    kind: "critica",
    title: title || "Sin título",
    summary: fields.summary,
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
