import { inArray } from "drizzle-orm";
import { expect, test } from "@playwright/test";

import { db } from "../src/lib/db/client";
import { reviews } from "../src/lib/db/schema";
import { AUTOSAVE_DEBOUNCE_MS } from "../src/features/reviews/form-constants";

import { loginAsAuthor } from "./support/auth";

const cases = [
  {
    kind: "critica" as const,
    newPath: "/panel/criticas/nueva",
    listPath: "/panel",
    titleLabel: "Título de la obra",
    editorLabel: "Texto de la crítica",
    createLabel: "Crear crítica",
    body: `E2E placeholder crítica ${Date.now()}`,
    missing: "la bajada",
  },
  {
    kind: "entrevista" as const,
    newPath: "/panel/entrevistas/nueva",
    listPath: "/panel?tab=entrevistas",
    titleLabel: "Título de la entrevista",
    editorLabel: "Texto de la entrevista",
    createLabel: "Crear entrevista",
    body: `E2E placeholder entrevista ${Date.now()}`,
    missing: "la bajada",
  },
];

test.describe("título placeholder", () => {
  test.afterEach(async () => {
    const rows = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(inArray(reviews.body, cases.map((item) => item.body)));
    if (rows.length > 0) {
      await db.delete(reviews).where(inArray(reviews.id, rows.map((row) => row.id)));
    }
  });

  for (const item of cases) {
    test(`${item.kind}: el autosave placeholder no se puede publicar`, async ({ page }) => {
      await loginAsAuthor(page);
      await page.goto(item.newPath);
      await page.clock.install();
      await page.getByRole("textbox", { name: item.editorLabel }).click();
      await page.keyboard.insertText(item.body);
      await page.clock.runFor(AUTOSAVE_DEBOUNCE_MS + 500);
      const contentPath = item.kind === "critica" ? "criticas" : "entrevistas";
      await expect(page).toHaveURL(
        new RegExp(`/panel/${contentPath}/(?!nueva(?:$|[/?#]))[^/?#]+`),
      );
      const autosavedSlug = new URL(page.url()).pathname.split("/").pop();
      expect(autosavedSlug).toBeTruthy();

      await page.goto(item.listPath);
      const editHref = `/panel/${contentPath}/${autosavedSlug}`;
      const card = page.locator("li").filter({ has: page.locator(`a[href="${editHref}"]`) });
      await expect(card).toBeVisible();
      await card.getByRole("button", { name: "Más acciones" }).click();
      await page.getByRole("menuitem", { name: "Publicar" }).click();
      await expect(page.getByText(/Para publicar falta completar el título/)).toBeVisible();
      await expect(card.getByText("Borrador", { exact: true })).toBeVisible();

      await card.getByRole("link", { name: "Editar" }).click();
      await page.getByLabel(item.titleLabel).fill(`Título válido ${item.kind}`);
      await page.getByLabel("Bajada").fill("Bajada válida");
      if (item.kind === "critica") {
        await page.locator("#eventDate").fill("2026-10-19");
        await page.getByLabel("Categoría").click();
        await page.getByRole("option").first().click();
        await page.getByRole("radio", { name: "3 estrellas" }).click();
      }
      await page.getByRole("button", { name: "Guardar cambios" }).click();
      await expect(page).toHaveURL(new RegExp(item.listPath.replace("?", "\\?")));

      const validCard = page.locator("li", { hasText: `Título válido ${item.kind}` });
      await validCard.getByRole("button", { name: "Más acciones" }).click();
      await page.getByRole("menuitem", { name: "Publicar" }).click();
      await expect(validCard.getByText("Publicada")).toBeVisible();
    });

    test(`${item.kind}: el guardado manual rechaza título vacío y placeholder`, async ({ page }) => {
      await loginAsAuthor(page);
      await page.goto(item.newPath);
      await page.getByRole("textbox", { name: item.editorLabel }).click();
      await page.keyboard.insertText(item.body);

      for (const title of ["", "Sin título"]) {
        await page.getByLabel(item.titleLabel).fill(title);
        await page.getByLabel("Bajada").fill("Bajada válida");
        if (item.kind === "critica") {
          await page.locator("#eventDate").fill("2026-10-19");
          await page.getByLabel("Categoría").click();
          await page.getByRole("option").first().click();
          await page.getByRole("radio", { name: "3 estrellas" }).click();
        }
        await page.getByRole("button", { name: item.createLabel }).click();
        await expect(page.getByText(/El título/)).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`${item.kind === "critica" ? "criticas" : "entrevistas"}/nueva$`));
      }
    });
  }
});
