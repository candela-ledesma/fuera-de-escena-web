import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().min(1, "El email es obligatorio.").email("Ingresá un email válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export type SignInInput = z.infer<typeof signInSchema>;
