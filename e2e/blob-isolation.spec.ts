import { eq } from "drizzle-orm";
import { test, expect } from "@playwright/test";

import { db } from "../src/lib/db/client";
import { reviewImages, reviews } from "../src/lib/db/schema";

import { loginAsAuthor } from "./support/auth";
import { ContentFixtures } from "./support/content";

// Simula una fila heredada de producción: la imagen apunta a otro store.
// El borrado tiene que terminar bien sin intentar borrar ese archivo
// (qué URLs se mandan a borrar está cubierto en src/lib/blob.test.ts).
const FOREIGN_IMAGE_URL = "https://otrostoree2e.public.blob.vercel-storage.com/reviews/e2e-test-ajena.png";

const fixtures = new ContentFixtures();

test.afterEach(async () => {
  await fixtures.cleanup();
});

test("borrar una crítica con una imagen de otro store de Blob funciona y no la toca", async ({ page }) => {
  const review = await fixtures.create({ status: "draft" });
  await db.insert(reviewImages).values({
    reviewId: review.id,
    storagePath: FOREIGN_IMAGE_URL,
    altText: "Imagen de otro store",
    position: 1,
    isCover: true,
  });

  await loginAsAuthor(page);
  const row = page.locator("li", { hasText: review.title });
  await row.getByRole("button", { name: "Más acciones" }).click();
  await page.getByRole("menuitem", { name: "Borrar" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Borrar", exact: true }).click();

  await expect(page.getByText("Crítica borrada.")).toBeVisible();
  await expect(row).toHaveCount(0);

  const remaining = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.id, review.id));
  expect(remaining).toHaveLength(0);
  const images = await db.select({ id: reviewImages.id }).from(reviewImages).where(eq(reviewImages.reviewId, review.id));
  expect(images).toHaveLength(0);
});
