import { test, expect } from "@playwright/test";

import { loginAsAuthor } from "./support/auth";

test("el formulario de crítica vacío muestra los errores en español", async ({ page }) => {
  await loginAsAuthor(page);
  await page.goto("/panel/criticas/nueva");
  await expect(page.getByRole("textbox", { name: "Texto de la crítica" })).toBeVisible();

  await page.getByRole("button", { name: "Crear crítica" }).click();

  await expect(page.getByText("El título es obligatorio.")).toBeVisible();
  await expect(page.getByText("Elegí una categoría.")).toBeVisible();
  await expect(page.getByText("Elegí un puntaje de 1 a 5.")).toBeVisible();
  await expect(page.getByText(/Invalid input/)).toHaveCount(0);
  await expect(page).toHaveURL(/\/panel\/criticas\/nueva$/);
});
