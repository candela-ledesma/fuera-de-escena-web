import { expect, type Page } from "@playwright/test";

export const TEST_EMAIL = process.env.TEST_AUTHOR_EMAIL;
export const TEST_PASSWORD = process.env.TEST_AUTHOR_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error("TEST_AUTHOR_EMAIL y TEST_AUTHOR_PASSWORD deben estar configuradas en .env.test.");
}

export async function loginAsAuthor(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL!);
  await page.getByLabel("Contraseña", { exact: true }).fill(TEST_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
}
