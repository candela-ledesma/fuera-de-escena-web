import path from "path";

import { eq } from "drizzle-orm";
import { test, expect } from "@playwright/test";

import { db } from "../src/lib/db/client";
import { authors, categories, comments, reviews } from "../src/lib/db/schema";

const TEST_EMAIL = process.env.TEST_AUTHOR_EMAIL;
const TEST_PASSWORD = process.env.TEST_AUTHOR_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error(
    "TEST_AUTHOR_EMAIL y TEST_AUTHOR_PASSWORD deben estar configuradas (.env.local) para correr los tests e2e.",
  );
}

const REVIEW = {
  title: "Los hijos de la finada Mircheva, segunda parte",
  venue: "La Macanuda",
  eventDate: "2026-06-15",
  rating: "5",
  imageAlt: "Escena de la obra con los actores en la fiesta de cumpleaños",
  imageAlt2: "Primer plano del elenco durante la escena final",
  body: `“Los hijos de la finada Mircheva, segunda parte” nos sumerge otra vez en un ecosistema escénico donde el humor, el absurdo y la tragedia conviven y coexisten a lo largo de toda la presentación. No obstante, esta esperada precuela introduce una alteración en su premisa fundacional: si la obra original nos anclaba en la oscura solemnidad de un velorio, en esta segunda parte o precuela, todo ocurre durante un cumpleaños. El núcleo de la propuesta teatral y la gran apuesta de su dirección reside, justamente, en hacer que la tragedia ocurra en medio de la celebración.

Es claro que el montaje busca volver a impactar al espectador, aunque desde otro lugar completamente diferente. Si bien es innegable que esta operación escénica resulta interesante y disruptiva desde lo conceptual, considero que la primera parte tenía un impacto más potente en la memoria; mientras que aquel “triste” (entre muchas comillas) velorio generaba una incomodidad más cruda, más difícil de esquivar, acá, la tragedia aparece hábilmente envuelta en fiesta.

Pese a este deliberado cambio de tono dramático, uno de los grandes aciertos vuelve a ser el trabajo corporal porque la danza contemporánea atraviesa toda la obra, creando un universo poético donde los cuerpos se desequilibran, se expanden, caen, giran, demostrando que nada aparece como adorno coreográfico para el deleite visual. Lejos de ello, el movimiento siempre está diciendo algo latente. Existe un equilibrio entre los personajes en tanto bailarines, donde cada uno de ellos muestra su psique y personalidad a través de la danza. En el caso de ella, sus movimientos en escena dibujan a una mujer resolutiva, vivaz y decidida. En el caso de él, enfundado en su llamativo traje azul, el registro físico es disparatado, torpe y errático, rebotando por el espacio como un muñeco desbordado por la euforia. Este trabajo con lo físico establece un diálogo dramático con unas actuaciones impecables que trabajan constantemente entre los límites del grotesco, el absurdo y lo patético.

Y a la par de la corporalidad, el vestuario también construye sentido para la narrativa de la obra; toda esa estética inspirada en las décadas del ´40 y ´50 genera personajes exagerados, artificiales, como detenidos en el tiempo. Esta poética visual da la inevitable sensación de que estamos presenciando a una familia que estuviera atrapada en una fiesta eterna que intenta tapar algo que ya no puede ocultarse más.

En cuanto a los elementos inmersivos, el dispositivo participativo aparece una vez más para fisurar esa bendita cuarta pared prescindiendo de esquemas tradicionales, logrando que el público no solamente observe, sino que entre desde antes al código de la obra. El hecho de pedir que cada espectador lleve un globo puede parecer mínimo en la previa, pero funciona en vivo como una forma de integrar al público a esa celebración incómoda. Al final de la jornada, todos terminamos comiendo la torta que es parte de la fiesta.

A su vez, la música, nuevamente en vivo hace una diferencia enorme en la inmersión del espectador. La presencia de la agrupación Shleper Klezmer no acompaña simplemente la escena, sino que la vuelve más intensa, más viva, más inestable. Los músicos logran que la melodía sostenga el clima festivo, pero al mismo tiempo deja aparecer algo melancólico que presagia el final.

En definitiva, nos encontramos ante una pieza teatral que nos vuelve a convocar. Recomiendo esta obra, en gran medida, porque no te deja ocupar un lugar cómodo en la platea. La puesta en escena te invita a la fiesta, te hace llevar un globo en la mano, te hace reír, bailar, participar… y cuando ya estás adentro, irremediablemente atrapado en su red, te obliga a mirar la tragedia de frente.

Elenco: Sofia Caporale; Francisco Mayor; Música: Shleper Klezmer. Sala: La Macanuda`,
  tags: "danza, teatro independiente, tragicomedia",
};

const EDITED_VENUE = "Biblioteca Rivadavia";

const COMMENT = {
  authorName: "Marina Gómez",
  body: "Hermosa puesta, me hizo reír y llorar en la misma escena.",
};

async function deleteLeftoverTestReviews() {
  await db.delete(reviews).where(eq(reviews.title, REVIEW.title));
}

test.describe("CRUD de críticas (panel de la autora)", () => {
  test.beforeAll(async () => {
    await deleteLeftoverTestReviews();
  });

  test.afterAll(async () => {
    await deleteLeftoverTestReviews();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.getByLabel("Contraseña").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
  });

  test("crea, edita, publica, despublica y borra una crítica", async ({ page }) => {
    await test.step("crear la crítica", async () => {
      await page.getByRole("link", { name: "Nueva crítica" }).click();
      await expect(page).toHaveURL(/\/panel\/criticas\/nueva$/);

      await page.getByLabel("Título de la obra").fill(REVIEW.title);
      await page.getByLabel("Teatro / lugar").fill(REVIEW.venue);
      await page.locator("#eventDate").fill(REVIEW.eventDate);

      await page.getByLabel("Categoría").click();
      await page.getByRole("option").first().click();

      await page.getByRole("radio", { name: `${REVIEW.rating} estrellas` }).click();

      await page.getByLabel("Texto de la crítica").fill(REVIEW.body);
      await page.getByLabel("Palabras clave").fill(REVIEW.tags);

      await page
        .getByTestId("review-image-input")
        .setInputFiles([
          path.join(__dirname, "fixtures", "test-image.png"),
          path.join(__dirname, "fixtures", "test-image-2.png"),
        ]);
      await page.getByPlaceholder("Descripción de la imagen 1 (accesibilidad)").fill(REVIEW.imageAlt);
      await page.getByPlaceholder("Descripción de la imagen 2 (accesibilidad)").fill(REVIEW.imageAlt2);

      await page.getByRole("radiogroup", { name: "Imagen de portada" }).getByRole("radio").nth(1).click();

      await page.getByRole("button", { name: "Crear crítica" }).click();
      await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
      await expect(page.getByText("Crítica creada.").first()).toBeVisible();
      await expect(page.getByText(REVIEW.title)).toBeVisible();
      await expect(page.getByText("Borrador").first()).toBeVisible();
    });

    const reviewCard = page.locator("li", { hasText: REVIEW.title });

    await test.step("el botón 'Ver publicación' no aparece en borrador", async () => {
      await expect(reviewCard.getByRole("link", { name: "Ver publicación" })).not.toBeVisible();
    });

    await test.step("la miniatura del panel muestra la portada elegida (segunda imagen)", async () => {
      await expect(reviewCard.getByAltText(REVIEW.imageAlt2)).toBeVisible();
      await expect(reviewCard.getByAltText(REVIEW.imageAlt)).not.toBeVisible();
    });

    await test.step("publicar la crítica", async () => {
      await reviewCard.getByRole("button", { name: "Más acciones" }).click();
      await page.getByRole("menuitem", { name: "Publicar" }).click();
      await expect(reviewCard.getByText("Publicada")).toBeVisible();
      await expect(reviewCard.getByRole("link", { name: "Ver publicación" })).toBeVisible();
    });

    await test.step("la crítica publicada aparece en la vista pública con la portada elegida", async () => {
      await page.goto("/");
      const homeCard = page.getByRole("link", { name: new RegExp(REVIEW.title) });
      await expect(homeCard).toBeVisible();
      await expect(homeCard.getByAltText(REVIEW.imageAlt2)).toBeVisible();
      await expect(homeCard.getByAltText(REVIEW.imageAlt)).not.toBeVisible();

      await homeCard.click();
      await expect(page).toHaveURL(/\/critica\/.+/);
      await expect(page.getByRole("heading", { name: REVIEW.title })).toBeVisible();
      await expect(page.getByText(REVIEW.venue).first()).toBeVisible();
      await expect(page.getByAltText(REVIEW.imageAlt2)).toBeVisible();
      await expect(page.getByAltText(REVIEW.imageAlt)).toBeVisible();
    });

    await test.step("reaccionar, reemplazar por otra reacción exclusiva y togglear", async () => {
      const likeButton = page.getByRole("button", { name: "Me gusta" });
      const loveButton = page.getByRole("button", { name: /^Me encanta/ });

      await expect(likeButton).toBeVisible();
      await expect(loveButton).toBeVisible();

      await likeButton.click();
      const likeActive = page.getByRole("button", { name: "Me gusta · 1" });
      await expect(likeActive).toBeVisible();
      await expect(likeActive).toHaveAttribute("aria-pressed", "true");
      await page.waitForTimeout(500);
      await page.reload();
      await expect(page.getByRole("button", { name: "Me gusta · 1" })).toBeVisible();

      // Elegir otra reacción reemplaza la anterior (modelo exclusivo tipo Facebook).
      await page.getByRole("button", { name: /^Me encanta/ }).click();
      const loveActive = page.getByRole("button", { name: "Me encanta · 1" });
      await expect(loveActive).toBeVisible();
      await expect(loveActive).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByRole("button", { name: "Me gusta" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Me gusta" })).toHaveAttribute("aria-pressed", "false");
      await page.waitForTimeout(500);
      await page.reload();
      await expect(page.getByRole("button", { name: "Me encanta · 1" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Me gusta" })).toBeVisible();

      // Repetir el mismo tipo activo la apaga (toggle off).
      await page.getByRole("button", { name: /^Me encanta/ }).click();
      await expect(page.getByRole("button", { name: "Me encanta" })).toBeVisible();
      await page.waitForTimeout(500);
      await page.reload();
      await expect(page.getByRole("button", { name: "Me encanta" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Me gusta" })).toBeVisible();
    });

    await test.step("comentar y borrar el comentario", async () => {
      await page.getByLabel("Tu nombre").fill(COMMENT.authorName);
      await page.getByLabel("Comentario").fill(COMMENT.body);
      await page.getByRole("button", { name: "Publicar comentario" }).click();

      await expect(page.getByText("Comentario publicado.").first()).toBeVisible();
      await expect(page.getByText(COMMENT.body)).toBeVisible();
      await expect(page.getByText(COMMENT.authorName)).toBeVisible();

      await page.getByRole("button", { name: `Borrar comentario de ${COMMENT.authorName}` }).click();
      await expect(page.getByText(COMMENT.body)).not.toBeVisible();

      await page.goto("/panel");
    });

    await test.step("editar la crítica", async () => {
      await reviewCard.getByRole("link", { name: "Editar" }).click();
      await expect(page).toHaveURL(/\/panel\/criticas\/.+/);

      await expect(page.getByLabel("Título de la obra")).toHaveValue(REVIEW.title);
      await expect(page.getByLabel("Texto de la crítica")).toHaveValue(REVIEW.body);
      await expect(page.getByAltText(REVIEW.imageAlt)).toBeVisible();

      const coverRadios = page.getByRole("radiogroup", { name: "Imagen de portada" }).getByRole("radio");
      await expect(coverRadios.nth(0)).not.toBeChecked();
      await expect(coverRadios.nth(1)).toBeChecked();

      await page.getByLabel("Teatro / lugar").fill(EDITED_VENUE);
      await page.getByRole("button", { name: "Guardar cambios" }).click();

      await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
      await expect(page.getByText("Cambios guardados.").first()).toBeVisible();
      await expect(page.getByText(EDITED_VENUE)).toBeVisible();
    });

    await test.step("despublicar la crítica", async () => {
      await reviewCard.getByRole("button", { name: "Más acciones" }).click();
      await page.getByRole("menuitem", { name: "Pasar a borrador" }).click();
      await expect(reviewCard.getByText("Borrador")).toBeVisible();
      await expect(reviewCard.getByRole("link", { name: "Ver publicación" })).not.toBeVisible();
    });

    await test.step("la crítica despublicada ya no aparece en la vista pública", async () => {
      await page.goto("/");
      await page.reload();
      await expect(page.getByRole("link", { name: new RegExp(REVIEW.title) })).not.toBeVisible();
      await page.goto("/panel");
    });

    await test.step("borrar la crítica con confirmación", async () => {
      await reviewCard.getByRole("button", { name: "Más acciones" }).click();
      await page.getByRole("menuitem", { name: "Borrar" }).click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await page.getByRole("button", { name: "Borrar", exact: true }).click();
      await expect(page.getByText(REVIEW.title)).not.toBeVisible();
    });
  });
});

test.describe("Vista pública (sin sesión)", () => {
  test("un visitante anónimo no ve el botón de la autora", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Nueva crítica" })).not.toBeVisible();
  });

  test("un visitante anónimo no puede borrar comentarios ajenos", async ({ page }) => {
    const [author] = await db.select({ id: authors.id }).from(authors).limit(1);
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);

    const [review] = await db
      .insert(reviews)
      .values({
        authorId: author.id,
        categoryId: category.id,
        title: "Crítica de prueba para moderación anónima",
        body: "Cuerpo de prueba.",
        slug: "critica-prueba-moderacion-anonima",
        rating: 4,
        status: "published",
        publishedAt: new Date(),
      })
      .returning({ id: reviews.id, slug: reviews.slug });

    await db.insert(comments).values({
      reviewId: review.id,
      authorName: COMMENT.authorName,
      body: COMMENT.body,
      status: "approved",
    });

    try {
      await page.goto(`/critica/${review.slug}`);
      await expect(page.getByText(COMMENT.body)).toBeVisible();
      await expect(
        page.getByRole("button", { name: `Borrar comentario de ${COMMENT.authorName}` }),
      ).not.toBeVisible();
    } finally {
      await db.delete(reviews).where(eq(reviews.id, review.id));
    }
  });

  test("un visitante anónimo puede reaccionar sin ver contadores en cero", async ({ page }) => {
    const [author] = await db.select({ id: authors.id }).from(authors).limit(1);
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);

    const [review] = await db
      .insert(reviews)
      .values({
        authorId: author.id,
        categoryId: category.id,
        title: "Crítica de prueba para reacciones anónimas",
        body: "Cuerpo de prueba.",
        slug: "critica-prueba-reacciones-anonimas",
        rating: 4,
        status: "published",
        publishedAt: new Date(),
      })
      .returning({ id: reviews.id, slug: reviews.slug });

    try {
      await page.goto(`/critica/${review.slug}`);

      await expect(page.getByText("¿Qué te pareció la obra?")).toBeVisible();

      // Sin reacciones todavía, no debe verse ningún contador en 0.
      const wowButton = page.getByRole("button", { name: "Me sorprende" });
      await expect(wowButton).toBeVisible();
      await expect(page.getByText(/^0$/)).not.toBeVisible();
      await expect(page.getByText(/persona(s)? reaccion/)).not.toBeVisible();

      await wowButton.click();
      const wowActive = page.getByRole("button", { name: "Me sorprende · 1" });
      await expect(wowActive).toBeVisible();
      await expect(wowActive).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByText("1 persona reaccionó")).toBeVisible();

      await page.waitForTimeout(500);
      await page.reload();

      await expect(page.getByRole("button", { name: "Me sorprende · 1" })).toBeVisible();
      await expect(page.getByText("1 persona reaccionó")).toBeVisible();

      // Togglear de nuevo la apaga y vuelve a ocultar el contador y la prueba social.
      await page.getByRole("button", { name: "Me sorprende · 1" }).click();
      await expect(page.getByRole("button", { name: "Me sorprende" })).toBeVisible();
      await expect(page.getByText(/persona(s)? reaccion/)).not.toBeVisible();

      await page.waitForTimeout(500);
      await page.reload();
      await expect(page.getByRole("button", { name: "Me sorprende" })).toBeVisible();
      await expect(page.getByText(/persona(s)? reaccion/)).not.toBeVisible();
    } finally {
      await db.delete(reviews).where(eq(reviews.id, review.id));
    }
  });

  test("visitar el detalle incrementa vistas una sola vez por navegador", async ({ page }) => {
    const [author] = await db.select({ id: authors.id }).from(authors).limit(1);
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);

    const [review] = await db
      .insert(reviews)
      .values({
        authorId: author.id,
        categoryId: category.id,
        title: "Crítica de prueba para conteo de vistas",
        body: "Cuerpo de prueba.",
        slug: "critica-prueba-conteo-vistas",
        rating: 4,
        status: "published",
        publishedAt: new Date(),
      })
      .returning({ id: reviews.id, slug: reviews.slug });

    try {
      await page.goto(`/critica/${review.slug}`);
      await page.waitForTimeout(1000);

      const [afterFirstVisit] = await db
        .select({ viewCount: reviews.viewCount })
        .from(reviews)
        .where(eq(reviews.id, review.id));
      expect(afterFirstVisit.viewCount).toBe(1);

      await page.reload();
      await page.waitForTimeout(1000);

      const [afterSecondVisit] = await db
        .select({ viewCount: reviews.viewCount })
        .from(reviews)
        .where(eq(reviews.id, review.id));
      expect(afterSecondVisit.viewCount).toBe(1);

      await page.goto("/login");
      await page.getByLabel("Email").fill(TEST_EMAIL!);
      await page.getByLabel("Contraseña").fill(TEST_PASSWORD!);
      await page.getByRole("button", { name: "Ingresar" }).click();
      await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });

      const reviewCard = page.locator("li", { hasText: "Crítica de prueba para conteo de vistas" });
      await expect(reviewCard.getByLabel("1 vistas")).toBeVisible();
    } finally {
      await db.delete(reviews).where(eq(reviews.id, review.id));
    }
  });
});
