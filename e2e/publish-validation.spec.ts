import { test, expect, type Page } from "@playwright/test";

import { loginAsAuthor } from "./support/auth";
import { ContentFixtures } from "./support/content";

const fixtures = new ContentFixtures();

test.beforeEach(async ({ page }) => {
  await loginAsAuthor(page);
});

test.afterEach(async () => {
  await fixtures.cleanup();
});

async function publishFromPanel(page: Page, title: string, kind: "critica" | "entrevista" = "critica") {
  await page.goto(kind === "entrevista" ? "/panel?tab=entrevistas" : "/panel");
  const row = page.locator("li", { hasText: title });
  await row.getByRole("button", { name: "Más acciones" }).click();
  await page.getByRole("menuitem", { name: "Publicar" }).click();

  return row;
}

/**
 * Abre el formulario de edición y espera a que esté hidratado: si se escribe
 * antes, la hidratación restaura el valor original y el cambio se pierde.
 * El editor se monta solo en el cliente, en el mismo árbol que el form.
 */
async function openEditForm(page: Page, slug: string) {
  await page.goto(`/panel/criticas/${slug}`);
  await expect(page.getByRole("textbox", { name: "Texto de la crítica" })).toBeVisible();
}

test.describe("Validación al publicar desde el panel", () => {
  const cases = [
    {
      name: "sin bajada ni fecha",
      draft: { summary: null, eventDate: null },
      message: "Para publicar falta completar la bajada y la fecha de la función.",
    },
    {
      name: "sin bajada",
      draft: { summary: null },
      message: "Para publicar falta completar la bajada.",
    },
    {
      name: "sin fecha de función",
      draft: { eventDate: null },
      message: "Para publicar falta completar la fecha de la función.",
    },
  ];

  for (const { name, draft, message } of cases) {
    test(`una crítica ${name} no se publica y el error dice qué falta`, async ({ page }) => {
      const review = await fixtures.create({ status: "draft", ...draft });

      const row = await publishFromPanel(page, review.title);

      await expect(page.getByText(message, { exact: true })).toBeVisible();
      await expect(row.getByText("Borrador")).toBeVisible();
      expect((await fixtures.getSummaryAndDate(review.id)).status).toBe("draft");
    });
  }

  test("una entrevista sin bajada no se publica y el error dice qué falta", async ({ page }) => {
    const interview = await fixtures.create({ kind: "entrevista", status: "draft", summary: null });

    const row = await publishFromPanel(page, interview.title, "entrevista");

    await expect(page.getByText("Para publicar falta completar la bajada.", { exact: true })).toBeVisible();
    await expect(row.getByText("Borrador")).toBeVisible();
    expect((await fixtures.getSummaryAndDate(interview.id)).status).toBe("draft");
  });

  test("una crítica con bajada y fecha se publica", async ({ page }) => {
    const review = await fixtures.create({ status: "draft" });

    const row = await publishFromPanel(page, review.title);

    await expect(page.getByText("Crítica publicada.")).toBeVisible();
    await expect(row.getByText("Publicada")).toBeVisible();
  });
});

test.describe("Validación al editar una crítica publicada", () => {
  test("Guardar cambios (en vivo) sin bajada muestra qué falta y no guarda", async ({ page }) => {
    const review = await fixtures.create({ summary: "Bajada original." });

    await openEditForm(page, review.slug);
    await page.getByLabel("Bajada").fill("");
    await page.getByRole("button", { name: "Guardar cambios (en vivo)" }).click();

    await expect(page.getByText("Para publicar falta completar la bajada.", { exact: true })).toBeVisible();
    expect((await fixtures.getSummaryAndDate(review.id)).summary).toBe("Bajada original.");
  });

  test("Guardar cambios (en vivo) sin fecha muestra qué falta y no guarda", async ({ page }) => {
    const review = await fixtures.create({ eventDate: "2026-06-15" });

    await openEditForm(page, review.slug);
    await page.locator("#eventDate").fill("");
    await page.getByRole("button", { name: "Guardar cambios (en vivo)" }).click();

    await expect(
      page.getByText("Para publicar falta completar la fecha de la función.", { exact: true }),
    ).toBeVisible();
    expect((await fixtures.getSummaryAndDate(review.id)).eventDate).toBe("2026-06-15");
  });

  test("el autosave de una publicada sin bajada muestra qué falta y no guarda", async ({ page }) => {
    const review = await fixtures.create({ summary: "Bajada original." });

    await openEditForm(page, review.slug);
    await page.getByLabel("Bajada").fill("");

    // Autosave con debounce de 4s: el motivo aparece en la barra inferior.
    await expect(page.getByText("Para publicar falta completar la bajada.", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    expect((await fixtures.getSummaryAndDate(review.id)).summary).toBe("Bajada original.");
  });
});
