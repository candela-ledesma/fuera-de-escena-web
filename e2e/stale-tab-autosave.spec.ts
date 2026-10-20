import { eq } from "drizzle-orm";
import { expect, test } from "@playwright/test";

import { AUTOSAVE_DEBOUNCE_MS } from "../src/features/reviews/form-constants";
import { db } from "../src/lib/db/client";
import { reviews } from "../src/lib/db/schema";

import { loginAsAuthor } from "./support/auth";
import { ContentFixtures } from "./support/content";
import { openEditForm } from "./support/panel";

const cases = [
  { kind: "critica" as const, titleLabel: "Título de la obra", editorLabel: "Texto de la crítica" },
  { kind: "entrevista" as const, titleLabel: "Título de la entrevista", editorLabel: "Texto de la entrevista" },
];

for (const item of cases) {
  test(`protege autosave desde pestaña desactualizada (${item.kind})`, async ({ page }) => {
    const fixtures = new ContentFixtures();
    const draft = await fixtures.create({ kind: item.kind, status: "draft" });
    const publishedTitle = `${draft.title} publicada`;

    try {
      await loginAsAuthor(page);
      await openEditForm(page, item.kind, draft.slug);

      await db
        .update(reviews)
        .set({ title: publishedTitle, status: "published", publishedAt: new Date("2099-01-01T00:00:00.000Z") })
        .where(eq(reviews.id, draft.id));

      await page.getByLabel(item.titleLabel).fill("");
      await page.getByRole("textbox", { name: item.editorLabel }).click();
      await page.keyboard.insertText(" Cambio inválido desde la pestaña vieja");

      const actionResponse = page.waitForResponse(
        (response) => response.request().method() === "POST" && Boolean(response.request().headers()["next-action"]),
        { timeout: 15_000 },
      );
      await page.clock.runFor(AUTOSAVE_DEBOUNCE_MS + 1_000);
      await actionResponse;

      const [row] = await db
        .select({ title: reviews.title, body: reviews.body, status: reviews.status })
        .from(reviews)
        .where(eq(reviews.id, draft.id));

      expect(row).toEqual({ title: publishedTitle, body: "Cuerpo de prueba.", status: "published" });
      await expect(page.getByText(/No se pudo autoguardar: completá un título real/)).toBeVisible();
    } finally {
      await fixtures.cleanup();
    }
  });
}
