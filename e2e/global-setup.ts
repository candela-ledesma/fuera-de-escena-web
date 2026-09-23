import { wipeTestContent } from "./support/wipe";

// Cada corrida arranca con la base `test` sin contenido: los tests crean
// exactamente lo que necesitan y no dependen de datos existentes.
export default async function globalSetup() {
  await wipeTestContent();
}
