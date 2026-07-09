import { z } from "zod";

export const commentFormSchema = z.object({
  authorName: z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value : "Anónimo"),
    z.string().trim().max(80),
  ),
  body: z.string().trim().min(1, "El comentario no puede estar vacío.").max(2000),
  honeypot: z.string().max(0, "No se pudo enviar el comentario.").optional(),
});
