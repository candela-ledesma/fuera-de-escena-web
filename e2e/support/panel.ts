import { expect, type Page } from "@playwright/test";

const EDIT_PATH = { critica: "/panel/criticas", entrevista: "/panel/entrevistas" } as const;
const EDITOR_NAME = { critica: "Texto de la crítica", entrevista: "Texto de la entrevista" } as const;

/**
 * Abre el formulario de edición y espera a que esté hidratado: si se escribe
 * antes, la hidratación restaura el valor original y el cambio se pierde.
 * El editor se monta solo en el cliente, en el mismo árbol que el form.
 */
export async function openEditForm(page: Page, kind: "critica" | "entrevista", slug: string): Promise<void> {
  await page.goto(`${EDIT_PATH[kind]}/${slug}`);
  await expect(page.getByRole("textbox", { name: EDITOR_NAME[kind] })).toBeVisible();
}
