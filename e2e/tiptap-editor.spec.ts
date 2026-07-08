import { eq } from "drizzle-orm";
import { test, expect } from "@playwright/test";

import { db } from "../src/lib/db/client";
import { authors, categories, reviews } from "../src/lib/db/schema";

const TEST_EMAIL = process.env.TEST_AUTHOR_EMAIL;
const TEST_PASSWORD = process.env.TEST_AUTHOR_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error(
    "TEST_AUTHOR_EMAIL y TEST_AUTHOR_PASSWORD deben estar configuradas (.env.local) para correr los tests e2e.",
  );
}

async function deleteReviewsByTitlePrefix(prefix: string) {
  const rows = await db.select({ id: reviews.id, title: reviews.title }).from(reviews);
  const matching = rows.filter((row) => row.title.startsWith(prefix));
  await Promise.all(matching.map((row) => db.delete(reviews).where(eq(reviews.id, row.id))));
}

const TITLE_PREFIX = "E2E TipTap";

test.describe("Editor TipTap del panel", () => {
  test.beforeAll(async () => {
    await deleteReviewsByTitlePrefix(TITLE_PREFIX);
  });

  test.afterAll(async () => {
    await deleteReviewsByTitlePrefix(TITLE_PREFIX);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.getByLabel("Contraseña").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
  });

  test("la toolbar acotada aplica formato y el estado activo se refleja", async ({ page }) => {
    await page.goto("/panel/criticas/nueva");

    const editor = page.getByRole("textbox", { name: "Texto de la crítica" });
    await editor.click();
    await page.keyboard.type("negrita");

    // Seleccionar todo el texto tipeado y aplicar negrita sobre la selección.
    await page.keyboard.press("ControlOrMeta+A");

    const boldButton = page.getByRole("button", { name: "Negrita" });
    await boldButton.click();
    await expect(boldButton).toHaveAttribute("aria-pressed", "true");
    await expect(editor.locator("strong", { hasText: "negrita" })).toBeVisible();

    await boldButton.click();
    await expect(boldButton).toHaveAttribute("aria-pressed", "false");
    await expect(editor.locator("strong")).toHaveCount(0);
  });

  test("solo ofrece los controles acotados (sin tablas, colores ni tipografías)", async ({ page }) => {
    await page.goto("/panel/criticas/nueva");

    const toolbar = page.getByRole("toolbar", { name: "Formato de texto" });
    const expectedLabels = [
      "Negrita",
      "Itálica",
      "Subtítulo",
      "Subtítulo pequeño",
      "Cita",
      "Lista",
      "Lista numerada",
      "Enlace",
      "Deshacer",
      "Rehacer",
    ];

    for (const label of expectedLabels) {
      await expect(toolbar.getByRole("button", { name: label, exact: true })).toBeVisible();
    }

    await expect(page.getByRole("button", { name: /tabla/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /color/i })).toHaveCount(0);
  });

  test("el contenido publicado se ve idéntico en el editor y en la vista pública (paridad WYSIWYG)", async ({
    page,
  }) => {
    const title = `${TITLE_PREFIX} Paridad ${Date.now()}`;

    await page.goto("/panel/criticas/nueva");
    await page.getByLabel("Título de la obra").fill(title);

    const editor = page.getByRole("textbox", { name: "Texto de la crítica" });
    await editor.click();
    await page.keyboard.type("Parrafo normal.");
    await page.keyboard.press("Enter");

    await page.getByRole("button", { name: "Negrita" }).click();
    await page.keyboard.type("texto en negrita");
    await page.getByRole("button", { name: "Negrita" }).click();
    await page.keyboard.press("Enter");

    await page.getByRole("button", { name: "Subtítulo", exact: true }).click();
    await page.keyboard.type("Un subtitulo");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Subtítulo", exact: true }).click();

    await page.getByRole("button", { name: "Cita" }).click();
    await page.keyboard.type("Una cita textual.");

    await page.getByLabel("Categoría").click();
    await page.getByRole("option").first().click();
    await page.getByRole("radio", { name: "3 estrellas" }).click();

    await Promise.all([
      page.waitForURL(/\/panel\?saved=created$/, { timeout: 15_000 }),
      page.getByRole("button", { name: "Crear crítica" }).click(),
    ]);

    const reviewCard = page.locator("li", { hasText: title });
    await reviewCard.getByRole("button", { name: "Más acciones" }).click();
    await page.getByRole("menuitem", { name: "Publicar" }).click();
    await expect(reviewCard.getByText("Publicada")).toBeVisible();

    const editHref = await reviewCard.getByRole("link", { name: "Editar" }).getAttribute("href");
    const slug = editHref!.split("/").pop();

    await page.goto(editHref!);
    const reopenedEditor = page.getByRole("textbox", { name: "Texto de la crítica" });
    await expect(reopenedEditor).toContainText("Un subtitulo");
    const reopenedHtml = await reopenedEditor.innerHTML();

    await page.goto(`/critica/${slug}`);
    const publicContent = page.locator(".prose-editor").last();
    await expect(publicContent).toContainText("Un subtitulo");
    const publicHtml = await publicContent.innerHTML();

    // Normalizamos espacios/atributos incidentales de ProseMirror antes de comparar.
    const normalize = (html: string) => html.replace(/\s*<br[^>]*>\s*/g, "").trim();
    expect(normalize(publicHtml)).toBe(normalize(reopenedHtml));
  });

  test("rechaza un href javascript: inyectado directamente en el formulario", async ({ page }) => {
    const title = `${TITLE_PREFIX} XSS ${Date.now()}`;

    await page.goto("/panel/criticas/nueva");
    await page.getByLabel("Título de la obra").fill(title);

    const maliciousDoc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Click me",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    };

    await page.evaluate((doc) => {
      const input = document.querySelector('input[name="contentJson"]') as HTMLInputElement;
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )!.set!;
      nativeSetter.call(input, JSON.stringify(doc));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, maliciousDoc);

    await page.getByLabel("Categoría").click();
    await page.getByRole("option").first().click();
    await page.getByRole("radio", { name: "2 estrellas" }).click();

    await page.getByRole("button", { name: "Crear crítica" }).click();

    await expect(page.getByText("El contenido de la crítica no es válido.")).toBeVisible();
    await expect(page).toHaveURL(/\/panel\/criticas\/nueva$/);

    const [persisted] = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.title, title));
    expect(persisted).toBeUndefined();
  });

  test("un enlace http(s) válido se guarda con rel=noopener y target=_blank", async ({ page }) => {
    const title = `${TITLE_PREFIX} Link ${Date.now()}`;

    await page.goto("/panel/criticas/nueva");
    await page.getByLabel("Título de la obra").fill(title);

    const editor = page.getByRole("textbox", { name: "Texto de la crítica" });
    await editor.click();
    await page.keyboard.type("cartelera");
    await page.keyboard.down("Shift");
    for (let i = 0; i < "cartelera".length; i += 1) {
      await page.keyboard.press("ArrowLeft");
    }
    await page.keyboard.up("Shift");

    page.once("dialog", (dialog) => dialog.accept("https://example.com"));
    await page.getByRole("button", { name: "Enlace" }).click();

    await page.getByLabel("Categoría").click();
    await page.getByRole("option").first().click();
    await page.getByRole("radio", { name: "2 estrellas" }).click();

    await Promise.all([
      page.waitForURL(/\/panel\?saved=created$/, { timeout: 15_000 }),
      page.getByRole("button", { name: "Crear crítica" }).click(),
    ]);

    const [saved] = await db
      .select({ contentJson: reviews.contentJson })
      .from(reviews)
      .where(eq(reviews.title, title));

    const json = JSON.stringify(saved.contentJson);
    expect(json).toContain('"href":"https://example.com"');
    expect(json).toContain('"rel":"noopener noreferrer"');
    expect(json).not.toContain("javascript:");
  });

  test("una crítica migrada desde texto plano muestra sus párrafos en la vista pública", async ({
    page,
  }) => {
    const title = `${TITLE_PREFIX} Migrada ${Date.now()}`;
    const legacyText = "Primer párrafo migrado.\n\nSegundo párrafo migrado.";

    const [author] = await db.select({ id: authors.id }).from(authors).limit(1);
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);

    const [review] = await db
      .insert(reviews)
      .values({
        authorId: author.id,
        categoryId: category.id,
        title,
        body: legacyText,
        contentJson: {
          type: "doc",
          content: legacyText
            .split(/\n+/)
            .map((paragraph) => ({
              type: "paragraph",
              content: paragraph.trim() ? [{ type: "text", text: paragraph.trim() }] : [],
            })),
        },
        slug: `e2e-tiptap-migrada-${Date.now()}`,
        rating: 4,
        status: "published",
        publishedAt: new Date(),
      })
      .returning({ id: reviews.id, slug: reviews.slug });

    try {
      await page.goto(`/critica/${review.slug}`);
      await expect(page.getByText("Primer párrafo migrado.")).toBeVisible();
      await expect(page.getByText("Segundo párrafo migrado.")).toBeVisible();
    } finally {
      await db.delete(reviews).where(eq(reviews.id, review.id));
    }
  });
});

test.describe("Layout de dos columnas del formulario de crítica", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.getByLabel("Contraseña").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
  });

  test("en escritorio el editor y los metadatos aparecen lado a lado", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/panel/criticas/nueva");

    const titleBox = await page.getByLabel("Título de la obra").boundingBox();
    const venueBox = await page.getByLabel("Teatro / lugar").boundingBox();

    expect(titleBox).not.toBeNull();
    expect(venueBox).not.toBeNull();
    // La barra lateral de metadatos queda a la derecha del editor, no debajo.
    expect(venueBox!.x).toBeGreaterThan(titleBox!.x + titleBox!.width / 2);
  });

  test("en mobile el formulario se apila en una sola columna y el botón de guardar queda accesible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/panel/criticas/nueva");

    const titleBox = await page.getByLabel("Título de la obra").boundingBox();
    const venueBox = await page.getByLabel("Teatro / lugar").boundingBox();

    expect(titleBox).not.toBeNull();
    expect(venueBox).not.toBeNull();
    // Apilado: los metadatos quedan debajo del editor, no al costado.
    expect(venueBox!.y).toBeGreaterThan(titleBox!.y);

    await expect(page.getByRole("button", { name: "Crear crítica" })).toBeVisible();
  });
});
