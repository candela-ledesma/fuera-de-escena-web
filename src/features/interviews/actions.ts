"use server";

import { del, put } from "@vercel/blob";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAuthorSession } from "@/lib/auth/guards";
import { db } from "@/lib/db/client";

import { validateAndNormalizeContent } from "@/features/reviews/content-validation";
import {
  deleteReview,
  findTagsByName,
  getReviewByIdForAuthor,
  getReviewBySlugForAuthor,
  getReviewImages,
  insertReview,
  insertTags,
  replaceReviewImages,
  replaceReviewTags,
  setCoverImageByPosition,
  slugExists,
  updateReview,
  updateReviewDraftFields,
} from "@/features/reviews/queries";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_REVIEW_IMAGES,
  interviewDraftFormSchema,
  interviewFormSchema,
  slugify,
} from "@/features/reviews/schema";

export type InterviewFormState = {
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
  return interviewFormSchema.safeParse({
    title: formData.get("title"),
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
        const blob = await put(`interviews/${slug}-${Date.now()}-${index}`, file, {
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

export async function createInterview(
  _prevState: InterviewFormState,
  formData: FormData,
): Promise<InterviewFormState> {
  const parsed = parseForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { authorId } = await requireAuthorSession();
  const { title, contentJson, tags, coverIndex } = parsed.data;

  const validatedContent = validateAndNormalizeContent(contentJson);

  if (!validatedContent) {
    return { error: "El contenido de la entrevista no es válido." };
  }

  const slug = await resolveUniqueSlug(title);
  const tagIds = await resolveTagIds(tags);

  const imagesResult = await resolveFinalImages(formData, slug, coverIndex);

  if ("error" in imagesResult) {
    return { error: imagesResult.error };
  }

  await db.transaction(async (tx) => {
    const interview = await insertReview(
      {
        authorId,
        kind: "entrevista",
        title,
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

  const { title, contentJson, tags, coverIndex } = parsed.data;

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
  await Promise.all(images.map((image) => del(image.storagePath)));

  await deleteReview(existing.id);
  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/entrevista/${interviewSlug}`);
}

export async function setInterviewStatusAction(
  interviewSlug: string,
  status: "draft" | "published",
): Promise<void> {
  const { authorId } = await requireAuthorSession();
  const existing = await getReviewBySlugForAuthor(interviewSlug, authorId, "entrevista");

  if (!existing) {
    return;
  }

  await updateReview(existing.id, {
    status,
    publishedAt: status === "published" ? new Date() : null,
  });

  revalidatePath("/panel");
  revalidatePath("/");
  revalidatePath(`/entrevista/${interviewSlug}`);
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
    contentJson: formData.get("contentJson") || undefined,
    tags: formData.get("tags") || undefined,
  });

  if (!parsed.success) {
    return { error: "No se pudo guardar el borrador." };
  }

  const { authorId } = await requireAuthorSession();
  const { title, contentJson, tags } = parsed.data;

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

    const updated = await updateReviewDraftFields(interviewId, authorId, "entrevista", {
      title,
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
