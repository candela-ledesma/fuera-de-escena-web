import { cleanupOldRuns } from "./support/artifacts";
import { assertTestDatabase } from "./support/db-guard";
import { warmUpTestDatabase } from "./support/warmup";
import { wipeTestContent } from "./support/wipe";

export default async function globalSetup() {
  // Corridas viejas: se conservan las últimas (ver RUNS_TO_KEEP).
  const runId = process.env.E2E_RUN_ID;
  if (runId) {
    const deleted = cleanupOldRuns(process.cwd(), runId);
    if (deleted.length > 0) console.log(`[e2e] Artefactos viejos borrados: ${deleted.join(", ")}`);
  }

  assertTestDatabase();
  await warmUpTestDatabase();

  // Cada corrida arranca con la base `test` sin contenido: los tests crean
  // exactamente lo que necesitan y no dependen de datos existentes.
  await wipeTestContent();
}
