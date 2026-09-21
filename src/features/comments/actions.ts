"use server";

import { revalidatePath } from "next/cache";

import { requireAuthorSession } from "@/lib/auth/guards";
import { reviewPublicPath } from "@/lib/utils";

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

  const review = await getPublishedReviewIdBySlug(reviewSlug);

  if (!review) {
    return { error: "La publicación no existe." };
  }

  await insertComment({
    reviewId: review.id,
    authorName: parsed.data.authorName,
    body: parsed.data.body,
    status: "approved",
  });

  revalidatePath(reviewPublicPath(review.kind, reviewSlug));

  return {};
}

export async function deleteCommentAction(commentId: string): Promise<void> {
  await requireAuthorSession();

  const review = await getCommentReviewSlug(commentId);
  await deleteComment(commentId);

  if (review) {
    revalidatePath(reviewPublicPath(review.kind, review.slug));
  }
}
