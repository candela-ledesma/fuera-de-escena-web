"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAuthorSession } from "@/lib/auth/guards";
import { deleteOwnBlobs } from "@/lib/blob";
import { db } from "@/lib/db/client";

import { resolveFinalImages, resolveTagIds, resolveUniqueSlug } from "@/features/reviews/action-helpers";
import { validateAndNormalizeContent } from "@/features/reviews/content-validation";
import {
  deleteReview,
  getReviewByIdForAuthor,
  getReviewBySlugForAuthor,
  getReviewImages,
  insertReview,
  replaceReviewImages,
  replaceReviewTags,
  setCoverImageByPosition,
  updateReview,
  updateReviewDraftFields,
} from "@/features/reviews/queries";
import { getPublishError, interviewDraftFormSchema, interviewFormSchema } from "@/features/reviews/schema";

export type InterviewFormState = {
  error?: string;
};

function parseForm(formData: FormData) {
  return interviewFormSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") || undefined,
    contentJson: formData.get("contentJson"),
    tags: formData.get("tags") || undefined,
    coverIndex: formData.get("coverIndex") || undefined,
  });
}

export async function createInterview(
  _prevState: InterviewFormState,
  formData: FormData,
): Promise<InterviewFormState> {
  const parsed = parseForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { authorId } = await requireAuthorSession();
  const { title, summary, contentJson, tags, coverIndex } = parsed.data;

  const validatedContent = validateAndNormalizeContent(contentJson);

  if (!validatedContent) {
    return { error: "El contenido de la entrevista no es válido." };
  }

  const slug = await resolveUniqueSlug(title);
  const tagIds = await resolveTagIds(tags);

  const imagesResult = await resolveFinalImages(formData, slug, coverIndex, "interviews");

  if ("error" in imagesResult) {
    return { error: imagesResult.error };
  }

  await db.transaction(async (tx) => {
    const interview = await insertReview(
      {
        authorId,
        kind: "entrevista",
        title,
        summary: summary || null,
        venue: null,
        eventDate: null,
        categoryId: null,
        rating: null,
        body: validatedContent.plainText,
        contentJson: validatedContent.doc,
        slug,
      },
      tx,
    );

    if (tagIds.length > 0) {
      await replaceReviewTags(interview.id, tagIds, tx);
    }

    if (imagesResult.images.length > 0) {
      await replaceReviewImages(interview.id, imagesResult.images, tx);
    }
  });

  revalidatePath("/panel");
  revalidatePath("/");
  redirect("/panel?tab=entrevistas&saved=created");
}

export async function updateInterviewAction(
  interviewSlug: string,
  _prevState: InterviewFormState,
  formData: FormData,
): Promise<InterviewFormState> {
  const parsed = parseForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { authorId } = await requireAuthorSession();
  const existing = await getReviewBySlugForAuthor(interviewSlug, authorId, "entrevista");

  if (!existing) {
    return { error: "La entrevista no existe." };
  }

  const { title, summary, contentJson, tags, coverIndex } = parsed.data;

  if (existing.status === "published") {
    const publishError = getPublishError("entrevista", { summary, eventDate: null });
    if (publishError) return { error: publishError };
  }

  const validatedContent = validateAndNormalizeContent(contentJson);

  if (!validatedContent) {
    return { error: "El contenido de la entrevista no es válido." };
  }

  const slug = existing.slug;
  const tagIds = await resolveTagIds(tags);

  const hasImageOrder = formData.has("imageOrder");
  let imagesToDelete: string[] = [];
  let finalImages: { storagePath: string; altText: string; position: number; isCover: boolean }[] | null =
    null;

  if (hasImageOrder) {
    const imagesResult = await resolveFinalImages(formData, slug, coverIndex, "interviews");

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
  revalidatePath(`/entrevista/${slug}`);
  redirect("/panel?tab=entrevistas&saved=updated");
}

export async function deleteInterviewAction(interviewSlug: string): Promise<void> {
  const { authorId } = await requireAuthorSession();
  const existing = await getReviewBySlugForAuthor(interviewSlug, authorId, "entrevista");

  if (!existing) {
    return;
  }

  const images = await getReviewImages(existing.id);
  await deleteOwnBlobs(images.map((image) => image.storagePath));

  await deleteReview(existing.id);
  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/entrevista/${interviewSlug}`);
}

export async function setInterviewStatusAction(
  interviewSlug: string,
  status: "draft" | "published",
): Promise<{ error?: string }> {
  const { authorId } = await requireAuthorSession();
  const existing = await getReviewBySlugForAuthor(interviewSlug, authorId, "entrevista");

  if (!existing) {
    return { error: "La entrevista no existe." };
  }

  if (status === "published") {
    const publishError = getPublishError("entrevista", existing);
    if (publishError) return { error: publishError };
  }

  await updateReview(existing.id, {
    status,
    publishedAt: status === "published" ? new Date() : null,
  });

  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/entrevista/${interviewSlug}`);

  return {};
}

export type SaveInterviewDraftResult = { id: string; slug: string; savedAt: string } | { error: string };

/**
 * Autosave: no hace revalidatePath ni redirect (no navega), y usa un
 * schema parcial porque un borrador puede estar incompleto.
 */
export async function saveInterviewDraftAction(
  interviewId: string | null,
  formData: FormData,
): Promise<SaveInterviewDraftResult> {
  const parsed = interviewDraftFormSchema.safeParse({
    title: formData.get("title") || undefined,
    summary: formData.get("summary") || undefined,
    contentJson: formData.get("contentJson") || undefined,
    tags: formData.get("tags") || undefined,
  });

  if (!parsed.success) {
    return { error: "No se pudo guardar el borrador." };
  }

  const { authorId } = await requireAuthorSession();
  const { title, summary, contentJson, tags } = parsed.data;

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

  if (interviewId) {
    const existing = await getReviewByIdForAuthor(interviewId, authorId, "entrevista");

    if (!existing) {
      return { error: "El borrador no existe." };
    }

    // El autosave también corre sobre entrevistas publicadas: no puede dejarlas incompletas.
    if (existing.status === "published") {
      const publishError = getPublishError("entrevista", { summary, eventDate: null });
      if (publishError) return { error: publishError };
    }

    const updated = await updateReviewDraftFields(interviewId, authorId, "entrevista", {
      title,
      summary: summary || null,
      body,
      contentJson: normalizedContentJson,
    });

    if (!updated) {
      return { error: "No se pudo guardar el borrador." };
    }

    const tagIds = await resolveTagIds(tags);
    await replaceReviewTags(interviewId, tagIds);

    return { id: updated.id, slug: updated.slug, savedAt: updated.updatedAt.toISOString() };
  }

  const slug = await resolveUniqueSlug(title || "sin-titulo");
  const tagIds = await resolveTagIds(tags);

  const created = await insertReview({
    authorId,
    kind: "entrevista",
    title: title || "Sin título",
    summary: summary || null,
    venue: null,
    eventDate: null,
    categoryId: null,
    rating: null,
    body,
    contentJson: normalizedContentJson,
    slug,
  });

  if (tagIds.length > 0) {
    await replaceReviewTags(created.id, tagIds);
  }

  return { id: created.id, slug: created.slug, savedAt: new Date().toISOString() };
}
