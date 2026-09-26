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

function panelTabs(page: Page) {
  return page.getByRole("navigation", { name: "Secciones del panel" });
}

test.describe("Tabs del panel", () => {
  test("la tab activa lleva aria-current y sale de la URL", async ({ page }) => {
    await page.goto("/panel");
    await expect(panelTabs(page).getByRole("link", { name: "Críticas teatrales" })).toHaveAttribute("aria-current", "page");
    await expect(panelTabs(page).getByRole("link", { name: "Entrevistas" })).not.toHaveAttribute("aria-current");
    await expect(page.getByRole("heading", { level: 1, name: "Críticas" })).toBeVisible();

    await page.goto("/panel?tab=entrevistas");
    await expect(panelTabs(page).getByRole("link", { name: "Entrevistas" })).toHaveAttribute("aria-current", "page");
    await expect(panelTabs(page).getByRole("link", { name: "Críticas teatrales" })).not.toHaveAttribute("aria-current");
    await expect(page.getByRole("heading", { level: 1, name: "Entrevistas" })).toBeVisible();
  });

  test("solo se muestra la lista de la tab activa", async ({ page }) => {
    const review = await fixtures.create({ status: "draft" });
    const interview = await fixtures.create({ kind: "entrevista", status: "draft" });

    await page.goto("/panel?tab=entrevistas");
    await expect(page.getByText(interview.title)).toBeVisible();
    await expect(page.getByText(review.title)).toHaveCount(0);

    await page.goto("/panel");
    await expect(page.getByText(review.title)).toBeVisible();
    await expect(page.getByText(interview.title)).toHaveCount(0);
  });

  test("el botón atrás vuelve a la tab anterior", async ({ page }) => {
    await page.goto("/panel");
    await panelTabs(page).getByRole("link", { name: "Entrevistas" }).click();
    await expect(page).toHaveURL(/\/panel\?tab=entrevistas$/);
    await expect(page.getByRole("heading", { level: 1, name: "Entrevistas" })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/panel$/);
    await expect(panelTabs(page).getByRole("link", { name: "Críticas teatrales" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 1, name: "Críticas" })).toBeVisible();
  });

  test("subrayado activo en #9a7830 y texto activo en el color principal", async ({ page }) => {
    await page.goto("/panel");
    const active = panelTabs(page).getByRole("link", { name: "Críticas teatrales" });
    const inactive = panelTabs(page).getByRole("link", { name: "Entrevistas" });

    const styles = await active.evaluate((element) => {
      const style = getComputedStyle(element);
      return { border: style.borderBottomColor, color: style.color };
    });
    expect(styles.border).toBe("rgb(154, 120, 48)");
    expect(styles.color).toBe("rgb(42, 31, 24)");
    expect(await inactive.evaluate((element) => getComputedStyle(element).borderBottomColor)).toBe("rgba(0, 0, 0, 0)");
  });

  test("después de guardar: aviso, borra la copia local de ese id y limpia la URL", async ({ page }) => {
    const key = "fde:edit-copy:entrevista:00000000-0000-0000-0000-000000000abc";
    await page.evaluate((k) => window.localStorage.setItem(k, "{}"), key);

    await page.goto("/panel?tab=entrevistas&saved=updated&id=00000000-0000-0000-0000-000000000abc");

    await expect(page.getByText("Cambios guardados.")).toBeVisible();
    await expect(page).toHaveURL(/\/panel\?tab=entrevistas$/);
    expect(await page.evaluate((k) => window.localStorage.getItem(k), key)).toBeNull();
    await expect(panelTabs(page).getByRole("link", { name: "Entrevistas" })).toHaveAttribute("aria-current", "page");
  });
});
