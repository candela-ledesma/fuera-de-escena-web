import { db } from "../../src/lib/db/client";
import { comments, reactions, reviewImages, reviews, reviewTags, tags } from "../../src/lib/db/schema";

import { assertTestDatabase } from "./db-guard";

/**
 * Borra todo el contenido de la base `test` (críticas, entrevistas, sus
 * comentarios, reacciones, imágenes, tags; las vistas son una columna de
 * reviews) en una sola transacción. Deja categorías y autoras.
 *
 * No borra archivos de Blob: las filas de `test` heredadas de producción
 * apuntan a imágenes reales del store compartido.
 */
export async function wipeTestContent(): Promise<void> {
  assertTestDatabase();

  await db.transaction(async (tx) => {
    await tx.delete(comments);
    await tx.delete(reactions);
    await tx.delete(reviewTags);
    await tx.delete(reviewImages);
    await tx.delete(reviews);
    await tx.delete(tags);
  });
}
