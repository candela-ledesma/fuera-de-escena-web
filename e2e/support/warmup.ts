import { sql } from "drizzle-orm";

import { db } from "../../src/lib/db/client";

const DELAYS_MS = [2_000, 4_000];

/**
 * El branch `test` de Neon puede estar suspendido y tardar en despertar.
 * Una query simple con reintentos antes de empezar: si no responde, la suite
 * aborta con un mensaje claro en vez de fallar test por test.
 */
export async function warmUpTestDatabase(): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= DELAYS_MS.length; attempt += 1) {
    try {
      await db.execute(sql`select 1`);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < DELAYS_MS.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAYS_MS[attempt]));
      }
    }
  }

  const reason = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`La base test no respondió después de ${DELAYS_MS.length + 1} intentos: ${reason}`);
}
