import path from "path";

import { eq } from "drizzle-orm";
import { test, expect } from "@playwright/test";

import { db } from "../src/lib/db/client";
import { authors, reviews } from "../src/lib/db/schema";

const TEST_EMAIL = process.env.TEST_AUTHOR_EMAIL;
const TEST_PASSWORD = process.env.TEST_AUTHOR_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error(
    "TEST_AUTHOR_EMAIL y TEST_AUTHOR_PASSWORD deben estar configuradas (.env.local) para correr los tests e2e.",
  );
}

const INTERVIEW = {
  title: "E2E TEST — Entrevista a Sofía Caporale sobre danza y teatro independiente",
  summary: "Sofía Caporale cuenta cómo la danza se volvió el eje de su trabajo en el teatro independiente bahiense.",
  imageAlt: "Retrato de la entrevistada en el ensayo",
  imageAlt2: "La entrevistada durante la función",
  body: `¿Cómo empezó tu relación con la danza dentro del teatro independiente de Bahía Blanca?

Empezó de una forma bastante casual, en un taller barrial, y de a poco se fue transformando en el eje de todo mi trabajo escénico. Nunca dejé de sorprenderme con lo que el cuerpo puede decir cuando las palabras no alcanzan.

¿Qué desafíos encontrás al llevar la danza contemporánea a un elenco con actores no formados en danza?

El principal desafío es correr el eje de la técnica pura y pensar el movimiento como una extensión del personaje. No busco que bailen bien, busco que digan algo con el cuerpo.`,
  tags: "danza, entrevista, teatro independiente",
};

const EDITED_TITLE_SUFFIX = " (editado)";

const DRAFT_INTERVIEW = {
  title: "E2E TEST — Borrador de entrevista sin publicar para probar autosave",
  body: "Texto parcial de entrevista escrito mientras se prueba el autosave del panel.",
};

const COMMENT = {
  authorName: "Lucía Fernández",
  body: "Qué buena entrevista, muy claro el recorrido artístico.",
};

function plainTextDoc(text: string) {
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

async function deleteLeftoverTestInterviews() {
  await db.delete(reviews).where(eq(reviews.title, INTERVIEW.title));
  await db.delete(reviews).where(eq(reviews.title, `${INTERVIEW.title}${EDITED_TITLE_SUFFIX}`));
  await db.delete(reviews).where(eq(reviews.title, DRAFT_INTERVIEW.title));
}

test.describe("CRUD de entrevistas (panel de la autora)", () => {
  test.beforeAll(async () => {
    await deleteLeftoverTestInterviews();
  });

  test.afterAll(async () => {
    await deleteLeftoverTestInterviews();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.locator("#password").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
  });

  test("crea, edita, publica, despublica y borra una entrevista", async ({ page }) => {
    await test.step("crear la entrevista desde el tab Entrevistas del panel", async () => {
      await page.goto("/panel");
      await page.getByRole("button", { name: "Entrevistas" }).click();
      await expect(page).toHaveURL(/\/panel\?tab=entrevistas$/);

      await page.getByRole("link", { name: "Escribir una entrevista" }).click();
      await expect(page).toHaveURL(/\/panel\/entrevistas\/nueva$/);

      await page.getByLabel("Título de la entrevista").fill(INTERVIEW.title);
      await page.getByLabel("Bajada").fill(INTERVIEW.summary);

      await page.getByRole("textbox", { name: "Texto de la entrevista" }).click();
      await page.keyboard.insertText(INTERVIEW.body);
      await page.getByLabel("Palabras clave").fill(INTERVIEW.tags);

      await page
        .getByTestId("review-image-input")
        .setInputFiles([
          path.join(__dirname, "fixtures", "test-image.png"),
          path.join(__dirname, "fixtures", "test-image-2.png"),
        ]);
      await page.getByPlaceholder("Descripción de la imagen 1 (accesibilidad)").fill(INTERVIEW.imageAlt);
      await page.getByPlaceholder("Descripción de la imagen 2 (accesibilidad)").fill(INTERVIEW.imageAlt2);

      await page.getByRole("radiogroup", { name: "Imagen de portada" }).getByRole("radio").nth(1).click();

      await page.getByRole("button", { name: "Crear entrevista" }).click();
      await expect(page).toHaveURL(/\/panel\?tab=entrevistas/, { timeout: 15_000 });
      await expect(page.getByText("Entrevista creada.").first()).toBeVisible();
      await expect(page.getByText(INTERVIEW.title)).toBeVisible();
      await expect(page.getByText("Borrador").first()).toBeVisible();
    });

    const interviewCard = page.locator("li", { hasText: INTERVIEW.title });

    await test.step("la entrevista en borrador no aparece en el listado de críticas", async () => {
      await page.goto("/panel");
      await expect(page.getByText(INTERVIEW.title)).not.toBeVisible();
      await page.goto("/panel?tab=entrevistas");
    });

    await test.step("publicar la entrevista", async () => {
      await interviewCard.getByRole("button", { name: "Más acciones" }).click();
      await page.getByRole("menuitem", { name: "Publicar" }).click();
      await expect(interviewCard.getByText("Publicada")).toBeVisible();
      await expect(interviewCard.getByRole("link", { name: "Ver publicación" })).toBeVisible();
    });

    await test.step("la entrevista publicada aparece en /entrevista con la portada elegida, no en /critica", async () => {
      await page.goto("/critica");
      await expect(page.getByRole("link", { name: new RegExp(INTERVIEW.title) })).not.toBeVisible();

      await page.goto("/entrevista");
      const listCard = page.getByTestId("review-card").filter({ hasText: INTERVIEW.title });
      await expect(listCard).toBeVisible();
      await expect(listCard.getByAltText(INTERVIEW.imageAlt2)).toBeVisible();
      await expect(listCard.getByAltText(INTERVIEW.imageAlt)).not.toBeVisible();

      await listCard.getByRole("link", { name: INTERVIEW.title }).click();
      await expect(page).toHaveURL(/\/entrevista\/.+/);
      await expect(page.getByRole("heading", { name: INTERVIEW.title })).toBeVisible();
      await expect(page.getByAltText(INTERVIEW.imageAlt2)).toBeVisible();
      await expect(page.getByAltText(INTERVIEW.imageAlt)).toBeVisible();
    });

    await test.step("reaccionar a la entrevista publicada", async () => {
      const likeButton = page.getByRole("button", { name: "Me gusta" });
      await expect(likeButton).toBeVisible();
      await likeButton.click();
      const likeActive = page.getByRole("button", { name: "Me gusta · 1" });
      await expect(likeActive).toBeVisible();
      await expect(likeActive).toHaveAttribute("aria-pressed", "true");
      await page.waitForTimeout(500);
      await page.reload();
      await expect(page.getByRole("button", { name: "Me gusta · 1" })).toBeVisible();

      // Toggle off para dejar el estado limpio para el resto del flujo.
      await page.getByRole("button", { name: "Me gusta · 1" }).click();
      await expect(page.getByRole("button", { name: "Me gusta" })).toBeVisible();
    });

    await test.step("comentar y borrar el comentario en una entrevista", async () => {
      await page.getByLabel("Tu nombre").fill(COMMENT.authorName);
      await page.getByLabel("Comentario").fill(COMMENT.body);
      await page.getByRole("button", { name: "Publicar comentario" }).click();

      await expect(page.getByText("Comentario publicado.").first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(COMMENT.body)).toBeVisible();

      await page.getByRole("button", { name: `Borrar comentario de ${COMMENT.authorName}` }).click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await page.getByRole("button", { name: "Borrar", exact: true }).click();
      await expect(page.getByText(COMMENT.body)).not.toBeVisible();

      await page.goto("/panel?tab=entrevistas");
    });

    await test.step("editar la entrevista y verificar paridad WYSIWYG editor/público", async () => {
      await interviewCard.getByRole("link", { name: "Editar" }).click();
      await expect(page).toHaveURL(/\/panel\/entrevistas\/.+/);

      await expect(page.getByLabel("Título de la entrevista")).toHaveValue(INTERVIEW.title);
      await expect(page.getByRole("textbox", { name: "Texto de la entrevista" })).toContainText(
        "Empezó de una forma bastante casual",
      );
      await expect(page.getByText("Publicada · editando")).toBeVisible();

      const editedTitle = `${INTERVIEW.title}${EDITED_TITLE_SUFFIX}`;
      await page.getByLabel("Título de la entrevista").fill(editedTitle);
      await page.getByRole("button", { name: "Guardar cambios (en vivo)" }).click();

      await expect(page).toHaveURL(/\/panel\?tab=entrevistas/, { timeout: 15_000 });
      await expect(page.getByText("Cambios guardados.").first()).toBeVisible();
      await expect(page.getByText(editedTitle)).toBeVisible();

      const editedCard = page.locator("li", { hasText: editedTitle });
      const publicUrl = await editedCard.getByRole("link", { name: "Ver publicación" }).getAttribute("href");
      await page.goto(publicUrl!);
      await expect(page.getByRole("heading", { name: editedTitle })).toBeVisible();

      // Revertir el título para que el cleanup por INTERVIEW.title siga operando sobre la misma fila.
      await page.goto("/panel?tab=entrevistas");
      await editedCard.getByRole("link", { name: "Editar" }).click();
      await page.getByLabel("Título de la entrevista").fill(INTERVIEW.title);
      await page.getByRole("button", { name: "Guardar cambios (en vivo)" }).click();
      await expect(page).toHaveURL(/\/panel\?tab=entrevistas/, { timeout: 15_000 });
    });

    await test.step("despublicar la entrevista y verificar que desaparece de lo público", async () => {
      await interviewCard.getByRole("button", { name: "Más acciones" }).click();
      await page.getByRole("menuitem", { name: "Pasar a borrador" }).click();
      await expect(interviewCard.getByText("Borrador")).toBeVisible();
      await expect(interviewCard.getByRole("link", { name: "Ver publicación" })).not.toBeVisible();

      for (const path of ["/entrevista", "/"]) {
        await page.goto(path);
        await expect(page.getByRole("link", { name: new RegExp(INTERVIEW.title) })).not.toBeVisible();
      }
      await page.goto("/panel?tab=entrevistas");
    });

    await test.step("borrar la entrevista vía ConfirmDialog", async () => {
      await interviewCard.getByRole("button", { name: "Más acciones" }).click();
      await page.getByRole("menuitem", { name: "Borrar" }).click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await expect(page.getByText("¿Borrar esta entrevista?")).toBeVisible();
      await page.getByRole("button", { name: "Borrar", exact: true }).click();
      await expect(page.getByText(INTERVIEW.title)).not.toBeVisible();
    });
  });

  test("el autosave de una entrevista guarda un borrador y se recupera al recargar", async ({ page }) => {
    await page.goto("/panel/entrevistas/nueva");

    await page.getByLabel("Título de la entrevista").fill(DRAFT_INTERVIEW.title);
    await page.getByRole("textbox", { name: "Texto de la entrevista" }).click();
    await page.keyboard.type(DRAFT_INTERVIEW.body);

    await expect(page.getByText("Guardado hace un momento")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/panel\/entrevistas\/(?!nueva$).+/);

    await page.reload();

    await expect(page.getByLabel("Título de la entrevista")).toHaveValue(DRAFT_INTERVIEW.title);
    await expect(page.getByRole("textbox", { name: "Texto de la entrevista" })).toContainText(
      DRAFT_INTERVIEW.body,
    );
    await expect(page.getByText("Borrador")).toBeVisible();

    await page.goto("/panel?tab=entrevistas");
    const draftCard = page.locator("li", { hasText: DRAFT_INTERVIEW.title });
    await expect(draftCard).toBeVisible();
    await expect(draftCard.getByText("Borrador", { exact: true })).toBeVisible();
  });
});

test.describe("Regresión: críticas y entrevistas no se mezclan", () => {
  test("los listados públicos mantienen críticas y entrevistas separadas", async ({ page }) => {
    const [author] = await db.select({ id: authors.id }).from(authors).limit(1);

    const [interview] = await db
      .insert(reviews)
      .values({
        authorId: author.id,
        kind: "entrevista",
        title: "E2E TEST — Entrevista de regresión para separación de listados",
        body: "Cuerpo de entrevista de prueba.",
        contentJson: plainTextDoc("Cuerpo de entrevista de prueba."),
        slug: "entrevista-regresion-separacion-listados",
        summary: "Bajada de prueba.",
        status: "published",
        publishedAt: new Date(),
      })
      .returning({ id: reviews.id, slug: reviews.slug });

    const [review] = await db
      .insert(reviews)
      .values({
        authorId: author.id,
        kind: "critica",
        title: "E2E TEST — Crítica de regresión para separación de listados",
        body: "Cuerpo de crítica de prueba.",
        contentJson: plainTextDoc("Cuerpo de crítica de prueba."),
        slug: "critica-regresion-separacion-listados",
        rating: 4,
        summary: "Bajada de prueba.",
        eventDate: "2026-06-15",
        status: "published",
        publishedAt: new Date(),
      })
      .returning({ id: reviews.id, slug: reviews.slug });

    try {
      await page.goto("/critica");
      await expect(page.getByRole("link", { name: /Crítica de regresión/ })).toBeVisible();
      await expect(page.getByRole("link", { name: /Entrevista de regresión/ })).not.toBeVisible();

      await page.goto("/entrevista");
      await expect(page.getByRole("link", { name: /Entrevista de regresión/ })).toBeVisible();
      await expect(page.getByRole("link", { name: /Crítica de regresión/ })).not.toBeVisible();

      // Una entrevista no es alcanzable en la ruta de detalle de críticas ni viceversa.
      await page.goto(`/critica/${interview.slug}`);
      await expect(page.getByRole("heading", { name: /Entrevista de regresión/ })).not.toBeVisible();

      await page.goto(`/entrevista/${review.slug}`);
      await expect(page.getByRole("heading", { name: /Crítica de regresión/ })).not.toBeVisible();
    } finally {
      await db.delete(reviews).where(eq(reviews.id, interview.id));
      await db.delete(reviews).where(eq(reviews.id, review.id));
    }
  });

  test("el panel de críticas y el de entrevistas mantienen los listados separados", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.locator("#password").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });

    const [author] = await db.select({ id: authors.id }).from(authors).limit(1);

    const [interview] = await db
      .insert(reviews)
      .values({
        authorId: author.id,
        kind: "entrevista",
        title: "E2E TEST — Entrevista de regresión para panel separado",
        body: "Cuerpo de entrevista de prueba.",
        contentJson: plainTextDoc("Cuerpo de entrevista de prueba."),
        slug: "entrevista-regresion-panel-separado",
        status: "draft",
      })
      .returning({ id: reviews.id });

    try {
      await page.goto("/panel");
      await expect(page.getByText("Entrevista de regresión para panel separado")).not.toBeVisible();

      await page.goto("/panel?tab=entrevistas");
      await expect(page.getByText("Entrevista de regresión para panel separado")).toBeVisible();
    } finally {
      await db.delete(reviews).where(eq(reviews.id, interview.id));
    }
  });
});

test.describe("Auth: gestión de entrevistas requiere sesión", () => {
  test("un visitante anónimo es redirigido a /login al intentar crear, editar o listar entrevistas del panel", async ({
    page,
  }) => {
    await page.goto("/panel?tab=entrevistas");
    await expect(page).toHaveURL(/\/login(\?|$)/);

    await page.goto("/panel/entrevistas/nueva");
    await expect(page).toHaveURL(/\/login(\?|$)/);

    const [author] = await db.select({ id: authors.id }).from(authors).limit(1);
    const [interview] = await db
      .insert(reviews)
      .values({
        authorId: author.id,
        kind: "entrevista",
        title: "E2E TEST — Entrevista de regresión para auth anónima",
        body: "Cuerpo de entrevista de prueba.",
        contentJson: plainTextDoc("Cuerpo de entrevista de prueba."),
        slug: "entrevista-regresion-auth-anonima",
        status: "draft",
      })
      .returning({ id: reviews.id });

    try {
      await page.goto(`/panel/entrevistas/${"entrevista-regresion-auth-anonima"}`);
      await expect(page).toHaveURL(/\/login(\?|$)/);
    } finally {
      await db.delete(reviews).where(eq(reviews.id, interview.id));
    }
  });
});

test.describe("Responsive: sin overflow horizontal en panel y público de entrevistas", () => {
  async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  }

  test("375px y 320px en la home y el listado de entrevistas", async ({ page }) => {
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 });
      for (const path of ["/", "/entrevista"]) {
        await page.goto(path);
        await expectNoHorizontalOverflow(page);
      }
    }
  });

  test("375px y 320px en la tab Entrevistas del panel", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.locator("#password").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });

    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto("/panel?tab=entrevistas");
      await expectNoHorizontalOverflow(page);
    }
  });
});
