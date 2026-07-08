import { z } from "zod";

export const MAX_REVIEW_IMAGES = 2;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const reviewContentSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.any()),
});

export const reviewFormSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio.").max(200),
  venue: z.string().trim().max(200).optional(),
  eventDate: z.string().trim().optional(),
  categoryId: z.string().trim().min(1, "Elegí una categoría."),
  rating: z.coerce.number().int().min(1, "El puntaje va de 1 a 5.").max(5, "El puntaje va de 1 a 5."),
  contentJson: z
    .string()
    .trim()
    .min(1, "El texto de la crítica es obligatorio.")
    .transform((value, ctx) => {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "El contenido de la crítica no es válido." });
        return z.NEVER;
      }
    })
    .pipe(reviewContentSchema),
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
  coverIndex: z.coerce
    .number()
    .int()
    .min(0)
    .max(MAX_REVIEW_IMAGES - 1)
    .optional()
    .default(0),
});

export const draftFormSchema = z.object({
  title: z.string().trim().max(200).optional().default(""),
  venue: z.string().trim().max(200).optional(),
  eventDate: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  contentJson: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return undefined;

      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "El contenido de la crítica no es válido." });
        return z.NEVER;
      }
    })
    .pipe(reviewContentSchema.optional()),
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

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
