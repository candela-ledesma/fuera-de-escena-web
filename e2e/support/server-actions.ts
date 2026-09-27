import type { Page, Response } from "@playwright/test";

/**
 * Promesa que se resuelve cuando responde la Server Action cuyo cuerpo incluye
 * `bodyIncludes` (por ejemplo, el tipo de reacción o el id de la crítica).
 * Hay que crearla ANTES de la acción que la dispara.
 *
 * Reemplaza esperas fijas antes de un reload: si la action tarda más que la
 * espera, el reload la corta y el cambio no se guarda. Con 1,5 s de latencia,
 * esperar 500 ms perdía la reacción 3 de 3 veces; esperar la respuesta, 0 de 3.
 */
export function waitForServerAction(page: Page, bodyIncludes: string): Promise<Response> {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      Boolean(response.request().headers()["next-action"]) &&
      (response.request().postData() ?? "").includes(bodyIncludes),
  );
}
