/**
 * La suite escribe y borra datos: solo puede correr contra el branch `test`
 * de Neon. E2E_DB_HOST (en .env.test) es el id del endpoint esperado, p. ej.
 * "ep-crimson-mouse-acfu13j6". Sin coincidencia exacta, error antes de tocar nada.
 */
export function assertTestDatabase(databaseUrl = process.env.DATABASE_URL): void {
  const expected = process.env.E2E_DB_HOST;

  if (!expected) {
    throw new Error("E2E_DB_HOST no está definido en .env.test: la suite no corre sin saber a qué base apunta.");
  }

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está definido: correr la suite con `npm run test:e2e` (usa .env.test).");
  }

  const endpoint = new URL(databaseUrl).hostname.split(".")[0].replace(/-pooler$/, "");

  if (endpoint !== expected) {
    throw new Error(
      `DATABASE_URL apunta a "${endpoint}" y E2E_DB_HOST espera "${expected}". Se aborta para no tocar otra base.`,
    );
  }
}
