import path from "path";

import { eq } from "drizzle-orm";
import { test, expect } from "@playwright/test";

import { db } from "../src/lib/db/client";
import { reviews } from "../src/lib/db/schema";

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
        .setInputFiles(path.join(__dirname, "fixtures", "test-image.png"));
      await page.getByPlaceholder("Descripción de la imagen 1 (accesibilidad)").fill(REVIEW.imageAlt);

      await page.getByRole("button", { name: "Crear crítica" }).click();
      await expect(page).toHaveURL(/\/panel$/);
      await expect(page.getByText("Crítica creada.")).toBeVisible();
      await expect(page.getByText(REVIEW.title)).toBeVisible();
      await expect(page.getByText("Borrador").first()).toBeVisible();
    });

    const reviewCard = page.locator("li", { hasText: REVIEW.title });

    await test.step("el botón 'Ver publicación' no aparece en borrador", async () => {
      await expect(reviewCard.getByRole("link", { name: "Ver publicación" })).not.toBeVisible();
    });

    await test.step("publicar la crítica", async () => {
      await reviewCard.getByRole("button", { name: "Publicar" }).click();
      await expect(reviewCard.getByText("Publicada")).toBeVisible();
      await expect(reviewCard.getByRole("link", { name: "Ver publicación" })).toBeVisible();
    });

    await test.step("la crítica publicada aparece en la vista pública", async () => {
      await page.goto("/");
      await expect(page.getByRole("link", { name: new RegExp(REVIEW.title) })).toBeVisible();

      await page.getByRole("link", { name: new RegExp(REVIEW.title) }).click();
      await expect(page).toHaveURL(/\/critica\/.+/);
      await expect(page.getByRole("heading", { name: REVIEW.title })).toBeVisible();
      await expect(page.getByText(REVIEW.venue).first()).toBeVisible();
      await expect(page.getByAltText(REVIEW.imageAlt)).toBeVisible();

      await page.goto("/panel");
    });

    await test.step("editar la crítica", async () => {
      await reviewCard.getByRole("link", { name: "Editar" }).click();
      await expect(page).toHaveURL(/\/panel\/criticas\/.+/);

      await expect(page.getByLabel("Título de la obra")).toHaveValue(REVIEW.title);
      await expect(page.getByLabel("Texto de la crítica")).toHaveValue(REVIEW.body);
      await expect(page.getByAltText(REVIEW.imageAlt)).toBeVisible();

      await page.getByLabel("Teatro / lugar").fill(EDITED_VENUE);
      await page.getByRole("button", { name: "Guardar cambios" }).click();

      await expect(page).toHaveURL(/\/panel$/);
      await expect(page.getByText("Cambios guardados.")).toBeVisible();
      await expect(page.getByText(EDITED_VENUE)).toBeVisible();
    });

    await test.step("despublicar la crítica", async () => {
      await reviewCard.getByRole("button", { name: "Pasar a borrador" }).click();
      await expect(reviewCard.getByText("Borrador")).toBeVisible();
      await expect(reviewCard.getByRole("link", { name: "Ver publicación" })).not.toBeVisible();
    });

    await test.step("la crítica despublicada ya no aparece en la vista pública", async () => {
      await page.goto("/");
      await page.reload();
      await expect(page.getByRole("link", { name: new RegExp(REVIEW.title) })).not.toBeVisible();
      await page.goto("/panel");
    });

    await test.step("borrar la crítica", async () => {
      await reviewCard.getByRole("button", { name: "Borrar" }).click();
      await expect(page.getByText(REVIEW.title)).not.toBeVisible();
    });
  });
});

test.describe("Vista pública (sin sesión)", () => {
  test("un visitante anónimo no ve el botón de la autora", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Nueva crítica" })).not.toBeVisible();
  });
});
