import { eq } from "drizzle-orm";
import { test, expect, type Page } from "@playwright/test";

import { db } from "../src/lib/db/client";
import { reviews } from "../src/lib/db/schema";

import { loginAsAuthor } from "./support/auth";
import { ContentFixtures } from "./support/content";

// Autosave del servidor (borradores): 4 s. Copia local (publicadas): 300 ms.
const PAST_AUTOSAVE_MS = 5_000;
const PAST_COPY_WRITE_MS = 1_000;

const fixtures = new ContentFixtures();

test.afterEach(async () => {
  await fixtures.cleanup();
});

type Kind = "critica" | "entrevista";

const PANEL_PATH: Record<Kind, string> = { critica: "/panel/criticas", entrevista: "/panel/entrevistas" };
const EDITOR_NAME: Record<Kind, string> = { critica: "Texto de la crítica", entrevista: "Texto de la entrevista" };
const TITLE_LABEL: Record<Kind, string> = { critica: "Título de la obra", entrevista: "Título de la entrevista" };

function copyKey(kind: Kind, id: string) {
  return `fde:edit-copy:${kind}:${id}`;
}

/** Cuenta los requests de Server Actions (autosave o guardado) desde que se llama. */
function trackServerActions(page: Page) {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.headers()["next-action"]) posts.push(request.url());
  });
  return {
    reset: () => posts.splice(0, posts.length),
    count: () => posts.length,
  };
}

async function openEditForm(page: Page, kind: Kind, slug: string) {
  await page.goto(`${PANEL_PATH[kind]}/${slug}`);
  // El editor se monta solo en el cliente: si es visible, el form está hidratado.
  await expect(page.getByRole("textbox", { name: EDITOR_NAME[kind] })).toBeVisible();
}

async function readRow(id: string) {
  const [row] = await db
    .select({ title: reviews.title, updatedAt: reviews.updatedAt })
    .from(reviews)
    .where(eq(reviews.id, id));
  return row;
}

async function readCopy(page: Page, kind: Kind, id: string) {
  return page.evaluate((key) => window.localStorage.getItem(key), copyKey(kind, id));
}

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await loginAsAuthor(page);
});

test.describe("Abrir el formulario no guarda nada", () => {
  for (const status of ["published", "draft"] as const) {
    test(`una crítica ${status === "published" ? "publicada" : "en borrador"}`, async ({ page }) => {
      const review = await fixtures.create({ status });
      const before = await readRow(review.id);
      const actions = trackServerActions(page);

      await openEditForm(page, "critica", review.slug);
      actions.reset();
      await page.clock.runFor(PAST_AUTOSAVE_MS);

      expect(actions.count()).toBe(0);
      expect((await readRow(review.id)).updatedAt.getTime()).toBe(before.updatedAt.getTime());
      expect(await readCopy(page, "critica", review.id)).toBeNull();
    });
  }
});

for (const kind of ["critica", "entrevista"] as const) {
  const noun = kind === "critica" ? "crítica" : "entrevista";

  test.describe(`Editar una ${noun} publicada`, () => {
    test("escribir no guarda en el servidor ni cambia el sitio público", async ({ page }) => {
      const item = await fixtures.create({ kind });
      const actions = trackServerActions(page);

      await openEditForm(page, kind, item.slug);
      actions.reset();
      await page.getByLabel(TITLE_LABEL[kind]).fill(`${item.title} (editado)`);
      await page.clock.runFor(PAST_AUTOSAVE_MS);

      expect(actions.count()).toBe(0);
      expect((await readRow(item.id)).title).toBe(item.title);
      await expect(page.getByTestId("autosave-status")).toHaveText(
        "Cambios sin guardar · copia local en este navegador (sin imágenes)",
      );
      expect(await readCopy(page, kind, item.id)).not.toBeNull();

      const publicPage = await page.context().newPage();
      await publicPage.goto(`/${kind}/${item.slug}`);
      await expect(publicPage.getByRole("heading", { name: item.title, exact: true })).toBeVisible();
      await expect(publicPage.getByText("(editado)")).toHaveCount(0);
      await publicPage.close();
    });

    test("recuperar los cambios después de recargar", async ({ page }) => {
      const item = await fixtures.create({ kind });
      page.on("dialog", (dialog) => dialog.accept()); // beforeunload al recargar

      await openEditForm(page, kind, item.slug);
      await page.getByLabel(TITLE_LABEL[kind]).fill(`${item.title} (recuperado)`);
      await page.clock.runFor(PAST_COPY_WRITE_MS);
      await page.reload();
      await expect(page.getByRole("textbox", { name: EDITOR_NAME[kind] })).toBeVisible();

      const banner = page.getByTestId("edit-copy-banner");
      await expect(banner).toContainText(`Tenés cambios sin guardar de esta ${noun}`);
      await expect(banner).toContainText("las imágenes no se incluyen");
      await expect(page.getByLabel(TITLE_LABEL[kind])).toHaveValue(item.title);

      await banner.getByRole("button", { name: "Recuperar" }).click();

      await expect(banner).toHaveCount(0);
      await expect(page.getByLabel(TITLE_LABEL[kind])).toHaveValue(`${item.title} (recuperado)`);
      expect((await readRow(item.id)).title).toBe(item.title);
    });
  });
}

test.describe("Copia local de una crítica publicada", () => {
  test("Guardar cambios actualiza el sitio, borra la copia y no dispara beforeunload", async ({ page }) => {
    const review = await fixtures.create();
    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.type());
      await dialog.dismiss();
    });

    await openEditForm(page, "critica", review.slug);
    const newTitle = `${review.title} (guardado)`;
    await page.getByLabel(TITLE_LABEL.critica).fill(newTitle);
    await page.clock.runFor(PAST_COPY_WRITE_MS);
    expect(await readCopy(page, "critica", review.id)).not.toBeNull();

    await page.getByRole("button", { name: "Guardar cambios (en vivo)" }).click();
    await expect(page).toHaveURL(/\/panel(\?|$)/, { timeout: 15_000 });

    expect(dialogs).toEqual([]);
    await expect.poll(() => readCopy(page, "critica", review.id)).toBeNull();
    expect((await readRow(review.id)).title).toBe(newTitle);

    await page.goto(`/critica/${review.slug}`);
    await expect(page.getByRole("heading", { name: newTitle, exact: true })).toBeVisible();

    await openEditForm(page, "critica", review.slug);
    await expect(page.getByTestId("edit-copy-banner")).toHaveCount(0);
  });

  test("con cambios, salir de la página pide confirmación (beforeunload)", async ({ page }) => {
    const review = await fixtures.create();

    await openEditForm(page, "critica", review.slug);
    await page.getByLabel(TITLE_LABEL.critica).fill(`${review.title} (sin guardar)`);
    await page.clock.runFor(PAST_COPY_WRITE_MS);

    const dialog = page.waitForEvent("dialog");
    await page.close({ runBeforeUnload: true });
    expect((await dialog).type()).toBe("beforeunload");
  });

  test("escribir y deshacer no deja copia ni aviso al recargar", async ({ page }) => {
    const review = await fixtures.create();
    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.type());
      await dialog.accept();
    });

    await openEditForm(page, "critica", review.slug);
    const title = page.getByLabel(TITLE_LABEL.critica);
    await title.fill(`${review.title} (temporal)`);
    await page.clock.runFor(PAST_COPY_WRITE_MS);
    expect(await readCopy(page, "critica", review.id)).not.toBeNull();

    await title.fill(review.title);
    await page.clock.runFor(PAST_COPY_WRITE_MS);
    expect(await readCopy(page, "critica", review.id)).toBeNull();

    await page.reload();
    await expect(page.getByRole("textbox", { name: EDITOR_NAME.critica })).toBeVisible();
    expect(dialogs).toEqual([]);
    await expect(page.getByTestId("edit-copy-banner")).toHaveCount(0);
  });

  test("descartar vuelve al original y el aviso no reaparece", async ({ page }) => {
    const review = await fixtures.create();
    page.on("dialog", (dialog) => dialog.accept());

    await openEditForm(page, "critica", review.slug);
    await page.getByLabel(TITLE_LABEL.critica).fill(`${review.title} (descartado)`);
    await page.clock.runFor(PAST_COPY_WRITE_MS);
    await page.reload();
    await expect(page.getByRole("textbox", { name: EDITOR_NAME.critica })).toBeVisible();

    await page.getByTestId("edit-copy-banner").getByRole("button", { name: "Descartar" }).click();

    await expect(page.getByTestId("edit-copy-banner")).toHaveCount(0);
    await expect(page.getByLabel(TITLE_LABEL.critica)).toHaveValue(review.title);
    expect(await readCopy(page, "critica", review.id)).toBeNull();

    await page.reload();
    await expect(page.getByRole("textbox", { name: EDITOR_NAME.critica })).toBeVisible();
    await expect(page.getByTestId("edit-copy-banner")).toHaveCount(0);
  });

  test("si la crítica cambió en el servidor después, el aviso lo dice y recuperar pide confirmación", async ({
    page,
  }) => {
    const review = await fixtures.create();
    page.on("dialog", (dialog) => dialog.accept());

    await openEditForm(page, "critica", review.slug);
    await page.getByLabel(TITLE_LABEL.critica).fill(`${review.title} (copia vieja)`);
    await page.clock.runFor(PAST_COPY_WRITE_MS);

    // Otro dispositivo guardó después de que empezó esta edición.
    await db
      .update(reviews)
      .set({ title: `${review.title} (otro dispositivo)`, updatedAt: new Date(Date.now() + 60 * 60_000) })
      .where(eq(reviews.id, review.id));

    await page.reload();
    await expect(page.getByRole("textbox", { name: EDITOR_NAME.critica })).toBeVisible();

    const banner = page.getByTestId("edit-copy-banner");
    await expect(banner).toContainText("La crítica se modificó después de estos cambios");
    await expect(banner.getByRole("button", { name: "Recuperar", exact: true })).toHaveCount(0);
    await expect(page.getByLabel(TITLE_LABEL.critica)).toHaveValue(`${review.title} (otro dispositivo)`);

    await banner.getByRole("button", { name: "Recuperar igual" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Recuperar" }).click();

    await expect(page.getByLabel(TITLE_LABEL.critica)).toHaveValue(`${review.title} (copia vieja)`);
    expect((await readRow(review.id)).title).toBe(`${review.title} (otro dispositivo)`);
  });

  test("borrar la crítica desde el panel borra su copia local", async ({ page }) => {
    const review = await fixtures.create({ status: "published" });
    page.on("dialog", (dialog) => dialog.accept());

    await openEditForm(page, "critica", review.slug);
    await page.getByLabel(TITLE_LABEL.critica).fill(`${review.title} (a borrar)`);
    await page.clock.runFor(PAST_COPY_WRITE_MS);
    expect(await readCopy(page, "critica", review.id)).not.toBeNull();

    await page.goto("/panel");
    const row = page.locator("li", { hasText: review.title });
    await row.getByRole("button", { name: "Más acciones" }).click();
    await page.getByRole("menuitem", { name: "Borrar" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Borrar", exact: true }).click();
    await expect(page.getByText("Crítica borrada.")).toBeVisible();

    await expect.poll(() => readCopy(page, "critica", review.id)).toBeNull();
  });
});
