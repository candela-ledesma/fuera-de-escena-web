import { eq } from "drizzle-orm";
import { test, expect } from "@playwright/test";

import { db } from "../src/lib/db/client";
import { reviews } from "../src/lib/db/schema";

import { loginAsAuthor } from "./support/auth";
import { ContentFixtures } from "./support/content";

const AUTOSAVE_DEBOUNCE_MS = 4000;

const fixtures = new ContentFixtures();

test.afterEach(async () => {
  await fixtures.cleanup();
});

test("después de un error del servidor al guardar, el autosave del borrador vuelve a guardar", async ({ page }) => {
  const draft = await fixtures.create({ status: "draft" });

  await page.clock.install();
  await loginAsAuthor(page);
  await page.goto(`/panel/criticas/${draft.slug}`);
  await expect(page.getByRole("textbox", { name: "Texto de la crítica" })).toBeVisible();

  // "Guardar cambios" está atado al slug y el autosave al id: si el slug cambia
  // en la base, el guardado devuelve { error } pero el autosave sigue siendo válido.
  await db.update(reviews).set({ slug: `${draft.slug}-movida` }).where(eq(reviews.id, draft.id));
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("La crítica no existe.")).toBeVisible();

  const newTitle = `${draft.title} (autosave)`;
  await page.getByLabel("Título de la obra").fill(newTitle);
  await page.clock.runFor(AUTOSAVE_DEBOUNCE_MS + 500);

  await expect
    .poll(async () => (await db.select({ title: reviews.title }).from(reviews).where(eq(reviews.id, draft.id)))[0]?.title)
    .toBe(newTitle);
});
