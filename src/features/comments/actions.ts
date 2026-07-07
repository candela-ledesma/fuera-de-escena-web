"use server";

import { revalidatePath } from "next/cache";

import { requireAuthorSession } from "@/lib/auth/guards";

import { commentFormSchema } from "./schema";
import {
  deleteComment,
  getCommentReviewSlug,
  getPublishedReviewIdBySlug,
  insertComment,
} from "./queries";

export type CommentFormState = {
  error?: string;
};

export async function createCommentAction(
  reviewSlug: string,
  _prevState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const parsed = commentFormSchema.safeParse({
    authorName: formData.get("authorName"),
    body: formData.get("body"),
    honeypot: formData.get("website"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const reviewId = await getPublishedReviewIdBySlug(reviewSlug);

  if (!reviewId) {
    return { error: "La crítica no existe." };
  }

  await insertComment({
    reviewId,
    authorName: parsed.data.authorName,
    body: parsed.data.body,
    status: "approved",
  });

  revalidatePath(`/critica/${reviewSlug}`);

  return {};
}

export async function deleteCommentAction(commentId: string): Promise<void> {
  await requireAuthorSession();

  const reviewSlug = await getCommentReviewSlug(commentId);
  await deleteComment(commentId);

  if (reviewSlug) {
    revalidatePath(`/critica/${reviewSlug}`);
  }
}
