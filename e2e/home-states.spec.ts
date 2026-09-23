import { test, expect } from "@playwright/test";

import { ContentFixtures } from "./support/content";
import { wipeTestContent } from "./support/wipe";

// Corre en el project "home-states", después del resto de la suite: cada
// test vacía el contenido de la base test y crea exactamente lo que necesita.
test.describe.configure({ mode: "serial" });

const fixtures = new ContentFixtures();

test.beforeEach(async () => {
  await wipeTestContent();
});

test.afterEach(async () => {
  await fixtures.cleanup();
});

test.describe("Estados de la home", () => {
  test("sin críticas publicadas muestra el estado vacío en vez del hero", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Todavía no hay críticas publicadas.")).toBeVisible();
    await expect(page.getByTestId("review-hero")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Críticas recientes" })).toHaveCount(0);
  });

  test("con una sola crítica publicada muestra el hero y no Críticas recientes", async ({ page }) => {
    const only = await fixtures.create();

    await page.goto("/");

    await expect(page.getByTestId("review-hero").getByRole("heading", { name: only.title })).toBeVisible();
    await expect(page.getByRole("region", { name: "Críticas recientes" })).toHaveCount(0);
  });

  test("sin entrevistas publicadas la sección Entrevistas no se renderiza", async ({ page }) => {
    await fixtures.create();
    await fixtures.create();
    await fixtures.create({ kind: "entrevista", status: "draft" });

    await page.goto("/");

    await expect(page.getByRole("region", { name: "Críticas recientes" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Entrevistas" })).toHaveCount(0);
  });
});
