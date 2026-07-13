import path from "path";

import { eq } from "drizzle-orm";
import { test, expect } from "@playwright/test";

import { db } from "../src/lib/db/client";
import { reviewImages, reviews } from "../src/lib/db/schema";

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

    await page.goto("/panel/criticas/nueva");
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

test.describe("Persistencia de imágenes al editar una crítica", () => {
  const EDIT_REVIEW_TITLE = "Crítica de prueba para borrado de imagen al editar";

  async function deleteLeftoverTestReview() {
    await db.delete(reviews).where(eq(reviews.title, EDIT_REVIEW_TITLE));
  }

  test.beforeAll(async () => {
    await deleteLeftoverTestReview();
  });

  test.afterAll(async () => {
    await deleteLeftoverTestReview();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.getByLabel("Contraseña").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
  });

  test("borrar una imagen existente al editar persiste el cambio", async ({ page }) => {
    await test.step("crear la crítica con dos imágenes", async () => {
      await page.getByRole("link", { name: "Escribir una crítica" }).click();
      await expect(page).toHaveURL(/\/panel\/criticas\/nueva$/);

      await page.getByLabel("Título de la obra").fill(EDIT_REVIEW_TITLE);
      await page.getByLabel("Categoría").click();
      await page.getByRole("option").first().click();
      await page.getByRole("radio", { name: "5 estrellas" }).click();

      await page.getByRole("textbox", { name: "Texto de la crítica" }).click();
      await page.keyboard.insertText("Cuerpo de prueba para el test de borrado de imágenes.");

      await page
        .getByTestId("review-image-input")
        .setInputFiles([
          path.join(__dirname, "fixtures", "test-image.png"),
          path.join(__dirname, "fixtures", "test-image-2.png"),
        ]);
      await page.getByPlaceholder("Descripción de la imagen 1 (accesibilidad)").fill("Primera imagen");
      await page.getByPlaceholder("Descripción de la imagen 2 (accesibilidad)").fill("Segunda imagen");

      await page.getByRole("button", { name: "Crear crítica" }).click();
      await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
      await expect(page.getByText("Crítica creada.").first()).toBeVisible();
    });

    const reviewCard = page.locator("li", { hasText: EDIT_REVIEW_TITLE });

    await test.step("editar la crítica y borrar la primera imagen", async () => {
      await reviewCard.getByRole("link", { name: "Editar" }).click();
      await expect(page).toHaveURL(/\/panel\/criticas\/.+/);

      await expect(page.getByAltText("Primera imagen")).toBeVisible();
      await expect(page.getByAltText("Segunda imagen")).toBeVisible();

      await page.getByRole("button", { name: "Eliminar imagen 1" }).click();

      await expect(page.getByAltText("Segunda imagen")).toBeVisible();
      await expect(page.getByAltText("Primera imagen")).not.toBeVisible();

      await page.getByRole("button", { name: "Guardar cambios" }).click();
      await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
      await expect(page.getByText("Cambios guardados.").first()).toBeVisible();
    });

    await test.step("la imagen borrada no persiste tras recargar el editor", async () => {
      await reviewCard.getByRole("link", { name: "Editar" }).click();
      await expect(page).toHaveURL(/\/panel\/criticas\/.+/);

      await expect(page.getByAltText("Segunda imagen")).toBeVisible();
      await expect(page.getByAltText("Primera imagen")).not.toBeVisible();
      await expect(page.getByPlaceholder(/Descripción de la imagen 2/)).not.toBeVisible();
    });

    await test.step("la base de datos solo conserva la imagen que no fue borrada", async () => {
      const [review] = await db
        .select({ id: reviews.id })
        .from(reviews)
        .where(eq(reviews.title, EDIT_REVIEW_TITLE));

      const images = await db.select().from(reviewImages).where(eq(reviewImages.reviewId, review.id));

      expect(images).toHaveLength(1);
      expect(images[0].altText).toBe("Segunda imagen");
    });
  });
});
