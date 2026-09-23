import { test, expect } from "@playwright/test";

import { ContentFixtures, getTestAuthor } from "./support/content";

// Los fixtures se publican en 2099: siempre son los más recientes, así que
// estos tests no dependen de qué más haya publicado en la base.
const fixtures = new ContentFixtures();

test.afterEach(async () => {
  await fixtures.cleanup();
});

test.describe("Home editorial", () => {
  test("el hero muestra la crítica publicada más reciente", async ({ page }) => {
    await fixtures.create();
    const latest = await fixtures.create({ summary: "Bajada de la más reciente." });

    await page.goto("/");

    const hero = page.getByTestId("review-hero");
    await expect(hero.getByRole("heading", { name: latest.title })).toBeVisible();
    await expect(hero.getByText("Bajada de la más reciente.")).toBeVisible();
    await expect(hero.getByRole("link", { name: `Leer crítica: ${latest.title}` })).toHaveAttribute(
      "href",
      `/critica/${latest.slug}`,
    );
  });

  test("la grilla de críticas recientes no repite la del hero", async ({ page }) => {
    const previous = await fixtures.create();
    const latest = await fixtures.create();

    await page.goto("/");

    const recent = page.getByRole("region", { name: "Críticas recientes" });
    await expect(recent.getByTestId("review-card").first()).toContainText(previous.title);
    await expect(recent.getByRole("link", { name: latest.title, exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: latest.title, exact: true })).toHaveCount(1);
  });

  test("se muestra la firma de la autora en el hero y en las cards", async ({ page }) => {
    const { displayName } = await getTestAuthor();
    expect(displayName, "La autora de prueba tiene que tener displayName en la base test.").toBeTruthy();

    const previous = await fixtures.create();
    await fixtures.create();

    await page.goto("/");

    await expect(page.getByTestId("review-hero").getByText(`por ${displayName}`)).toBeVisible();
    const card = page.getByTestId("review-card").filter({ hasText: previous.title });
    await expect(card.getByText(`por ${displayName}`)).toBeVisible();
  });

  test("la sección Entrevistas aparece con al menos una publicada y lleva al listado", async ({ page }) => {
    await fixtures.create();
    const interview = await fixtures.create({ kind: "entrevista" });

    await page.goto("/");

    const section = page.getByRole("region", { name: "Entrevistas" });
    await expect(section.getByTestId("review-card").filter({ hasText: interview.title })).toBeVisible();
    await expect(section.getByText(/^Entrevista · /)).toBeVisible();
    await expect(section.getByRole("link", { name: "Ver todas las entrevistas" })).toHaveAttribute(
      "href",
      "/entrevista",
    );
  });

  test("sin imagen de portada se muestra el fallback", async ({ page }) => {
    await fixtures.create();

    await page.goto("/");

    await expect(page.getByTestId("review-hero").getByTestId("cover-fallback")).toBeVisible();
  });

  test("las estrellas tienen un nombre accesible", async ({ page }) => {
    await fixtures.create({ rating: 4 });

    await page.goto("/");

    await expect(page.getByTestId("review-hero").getByRole("img", { name: "4 de 5 estrellas" })).toBeVisible();
  });

  test("sin fecha de función, el kicker de la card muestra solo la sala", async ({ page }) => {
    const withoutDate = await fixtures.create({ venue: "Sala Sin Fecha E2E", eventDate: null });
    await fixtures.create();

    await page.goto("/");

    const card = page.getByTestId("review-card").filter({ hasText: withoutDate.title });
    await expect(card.getByText("Sala Sin Fecha E2E", { exact: true })).toBeVisible();
  });

  for (const width of [390, 768, 1440]) {
    test(`sin scroll horizontal en ${width}px`, async ({ page }) => {
      await fixtures.create();
      await fixtures.create({ kind: "entrevista" });
      await fixtures.create();

      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");

      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasOverflow).toBe(false);
    });
  }
});
