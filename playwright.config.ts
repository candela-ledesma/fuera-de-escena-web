import { defineConfig, devices } from "@playwright/test";

// La suite escribe fixtures en la base: corre contra el branch `test` de Neon
// (.env.test), nunca contra dev ni producción. Puerto propio para no reusar
// por error un `npm run dev` que esté levantado en el 3000 contra `dev`.
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definido: correr la suite con `npm run test:e2e` (usa .env.test).");
}

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
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
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
