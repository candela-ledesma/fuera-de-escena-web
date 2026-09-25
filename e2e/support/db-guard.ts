import { getBlobStoreId } from "../../src/lib/blob";

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

/**
 * Mismo criterio para Blob: E2E_BLOB_STORE_ID (en .env.test) tiene que ser el
 * store del BLOB_READ_WRITE_TOKEN con el que corre la suite, que sube y borra
 * archivos. Se compara sin distinguir mayúsculas.
 */
export function assertTestBlobStore(env: Record<string, string | undefined> = process.env): void {
  const expected = env.E2E_BLOB_STORE_ID?.trim();

  if (!expected) {
    throw new Error("E2E_BLOB_STORE_ID no está definido en .env.test: la suite no corre sin saber qué store de Blob usa.");
  }

  const actual = getBlobStoreId({ BLOB_READ_WRITE_TOKEN: env.BLOB_READ_WRITE_TOKEN });

  if (!actual || actual.toLowerCase() !== expected.toLowerCase()) {
    throw new Error(
      `BLOB_READ_WRITE_TOKEN es del store "${actual ?? "desconocido"}" y E2E_BLOB_STORE_ID espera "${expected}". Se aborta.`,
    );
  }
}
