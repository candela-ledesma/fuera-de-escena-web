import { test, expect, type Page } from "@playwright/test";

import { loginAsAuthor } from "./support/auth";
import { ContentFixtures } from "./support/content";

const fixtures = new ContentFixtures();

test.afterEach(async () => {
  await fixtures.cleanup();
});

function mainNav(page: Page) {
  return page.getByRole("navigation", { name: "Principal" });
}

test.describe("Header y footer del sitio público", () => {
  test("el header no muestra Panel de autora a visitantes anónimos", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("link", { name: "Panel de autora" })).toHaveCount(0);
  });

  test("el header no muestra Panel de autora aunque haya sesión iniciada", async ({ page }) => {
    await loginAsAuthor(page);
    await page.goto("/");

    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("link", { name: "Panel de autora" })).toHaveCount(0);
  });

  test("Acceso autora en el footer lleva al login", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("contentinfo").getByRole("link", { name: "Acceso autora" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("Ítem activo del nav (aria-current)", () => {
  test("Críticas queda activo en el listado y en el detalle", async ({ page }) => {
    const review = await fixtures.create();

    for (const path of ["/critica", `/critica/${review.slug}`]) {
      await page.goto(path);
      await expect(mainNav(page).getByRole("link", { name: "Críticas" })).toHaveAttribute("aria-current", "page");
      await expect(mainNav(page).locator("[aria-current]")).toHaveCount(1);
    }
  });

  test("Entrevistas queda activo en su listado", async ({ page }) => {
    await page.goto("/entrevista");

    await expect(mainNav(page).getByRole("link", { name: "Entrevistas" })).toHaveAttribute("aria-current", "page");
    await expect(mainNav(page).locator("[aria-current]")).toHaveCount(1);
  });

  test("en la home ningún ítem queda activo", async ({ page }) => {
    await page.goto("/");

    await expect(mainNav(page)).toBeVisible();
    await expect(mainNav(page).locator("[aria-current]")).toHaveCount(0);
  });
});
