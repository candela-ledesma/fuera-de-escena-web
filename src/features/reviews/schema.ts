import { z } from "zod";

export const reviewStatusSchema = z.enum(["draft", "published"]);

export const reviewFormSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio.").max(200),
  venue: z.string().trim().max(200).optional(),
  eventDate: z.string().trim().optional(),
  categoryId: z.string().trim().min(1, "Elegí una categoría."),
  rating: z.coerce.number().int().min(1, "El puntaje va de 1 a 5.").max(5, "El puntaje va de 1 a 5."),
  body: z.string().trim().min(1, "El texto de la crítica es obligatorio."),
  tags: z
    .string()
    .trim()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    ),
});

export type ReviewFormInput = z.infer<typeof reviewFormSchema>;

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
