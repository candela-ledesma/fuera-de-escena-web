"use server";

import { randomUUID } from "crypto";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { ANON_ID_COOKIE, toggleReactionSchema } from "./schema";
import {
  deleteReactionByReviewAndAnon,
  getAnonReactionByReviewId,
  isReviewPublished,
  setReaction,
} from "./queries";

const ANON_ID_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

async function getOrCreateAnonId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(ANON_ID_COOKIE)?.value;

  if (existing) {
    return existing;
  }

  const anonId = randomUUID();

  cookieStore.set(ANON_ID_COOKIE, anonId, {
    maxAge: ANON_ID_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return anonId;
}

/**
 * Mutación pública: la puede llamar cualquier visitante anónimo.
 * Modelo exclusivo (tipo Facebook): cada visitante (cookie anon_id, sin PII)
 * tiene a lo sumo una reacción activa por reseña. Elegir un tipo nuevo
 * reemplaza cualquier reacción anterior; repetir el mismo tipo la quita.
 * Solo aplica a reseñas publicadas.
 */
export async function toggleReaction(
  reviewSlug: string,
  reviewId: string,
  type: string,
): Promise<void> {
  const parsed = toggleReactionSchema.safeParse({ reviewId, type });

  if (!parsed.success) {
    return;
  }

  const published = await isReviewPublished(parsed.data.reviewId);

  if (!published) {
    return;
  }

  const anonId = await getOrCreateAnonId();
  const existingType = await getAnonReactionByReviewId(parsed.data.reviewId, anonId);

  if (existingType === parsed.data.type) {
    await deleteReactionByReviewAndAnon(parsed.data.reviewId, anonId);
  } else {
    await setReaction(parsed.data.reviewId, parsed.data.type, anonId);
  }

  revalidatePath(`/critica/${reviewSlug}`);
}
