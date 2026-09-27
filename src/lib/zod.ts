import { z } from "zod";

// Mensajes por defecto en español. Todos los schemas importan `z` desde acá
// (no desde "zod"), así la configuración aplica en el servidor y en el
// cliente sin depender del orden de carga.
z.config(z.locales.es());

export { z };
