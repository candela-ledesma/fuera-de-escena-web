import { z } from "zod";

export const commentFormSchema = z.object({
  authorName: z.string().trim().min(1, "Tu nombre es obligatorio.").max(80),
  body: z.string().trim().min(1, "El comentario no puede estar vacío.").max(2000),
  honeypot: z.string().max(0, "No se pudo enviar el comentario.").optional(),
});
