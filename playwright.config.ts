import { defineConfig, devices } from "@playwright/test";

import { assertTestDatabase } from "./e2e/support/db-guard";

// La suite escribe fixtures en la base: corre contra el branch `test` de Neon
// (.env.test), nunca contra dev ni producción. Puerto propio para no reusar
// por error un `npm run dev` que esté levantado en el 3000 contra `dev`.
// Además, el globalSetup borra todo el contenido: se verifica el host antes de nada.
assertTestDatabase();

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 60_000,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /home-states\.spec\.ts/,
    },
    {
      // Estados globales de la home (0 críticas, 1 crítica, sin entrevistas):
      // vacían lo publicado, así que corren después de todo lo demás.
      name: "home-states",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /home-states\.spec\.ts/,
      dependencies: ["chromium"],
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
