import path from "path";

import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_AUTHOR_EMAIL;
const TEST_PASSWORD = process.env.TEST_AUTHOR_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error(
    "TEST_AUTHOR_EMAIL y TEST_AUTHOR_PASSWORD deben estar configuradas (.env.local) para correr los tests e2e.",
  );
}

const VALID_PNG_BUFFER = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000004000000040802000000269309" +
    "290000001149444154789c633832b1c2078e1888e30000d9921bc177d9303a00" +
    "0000004945454e44ae426082",
  "hex",
);

const OVERSIZED_PNG_BUFFER = Buffer.concat([
  VALID_PNG_BUFFER,
  Buffer.alloc(6 * 1024 * 1024),
]);

test.describe("Validación del uploader de imágenes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.getByLabel("Contraseña").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });

    await page.getByRole("link", { name: "Nueva crítica" }).click();
    await expect(page).toHaveURL(/\/panel\/criticas\/nueva$/);
  });

  test("rechaza un tipo de archivo no permitido sin romper el formulario", async ({ page }) => {
    await page.getByTestId("review-image-input").setInputFiles({
      name: "documento.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 fake content"),
    });

    await expect(page.getByText("Solo se aceptan imágenes JPG, PNG o WEBP.")).toBeVisible();
    await expect(page.getByPlaceholder(/Descripción de la imagen 1/)).not.toBeVisible();
  });

  test("rechaza una imagen que pesa más de 5MB", async ({ page }) => {
    await page.getByTestId("review-image-input").setInputFiles({
      name: "muy-pesada.png",
      mimeType: "image/png",
      buffer: OVERSIZED_PNG_BUFFER,
    });

    await expect(page.getByText("Cada imagen debe pesar menos de 5MB.")).toBeVisible();
    await expect(page.getByPlaceholder(/Descripción de la imagen 1/)).not.toBeVisible();
  });

  test("no permite agregar una tercera imagen cuando ya hay 2", async ({ page }) => {
    await page
      .getByTestId("review-image-input")
      .setInputFiles([
        path.join(__dirname, "fixtures", "test-image.png"),
        path.join(__dirname, "fixtures", "test-image-2.png"),
      ]);

    await expect(page.getByPlaceholder(/Descripción de la imagen 1/)).toBeVisible();
    await expect(page.getByPlaceholder(/Descripción de la imagen 2/)).toBeVisible();

    await page.getByTestId("review-image-input").setInputFiles({
      name: "tercera.png",
      mimeType: "image/png",
      buffer: VALID_PNG_BUFFER,
    });

    await expect(
      page.getByText("Ya tenés 2 imágenes. Eliminá una para agregar otra."),
    ).toBeVisible();
    await expect(page.getByPlaceholder(/Descripción de la imagen 3/)).not.toBeVisible();
  });

  test("borrar una imagen no afecta la otra", async ({ page }) => {
    await page
      .getByTestId("review-image-input")
      .setInputFiles([
        path.join(__dirname, "fixtures", "test-image.png"),
        path.join(__dirname, "fixtures", "test-image-2.png"),
      ]);

    const altInput1 = page.getByPlaceholder(/Descripción de la imagen 1/);
    const altInput2 = page.getByPlaceholder(/Descripción de la imagen 2/);
    await altInput1.fill("Primera imagen");
    await altInput2.fill("Segunda imagen");

    await page.getByRole("button", { name: "Eliminar imagen 1" }).click();

    await expect(page.getByPlaceholder(/Descripción de la imagen 1/)).toHaveValue("Segunda imagen");
    await expect(page.getByPlaceholder(/Descripción de la imagen 2/)).not.toBeVisible();
  });
});
