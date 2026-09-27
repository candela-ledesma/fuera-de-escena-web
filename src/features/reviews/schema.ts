import { z } from "@/lib/zod";

export const MAX_REVIEW_IMAGES = 2;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_SUMMARY_LENGTH = 200;

const summarySchema = z
  .string()
  .trim()
  .max(MAX_SUMMARY_LENGTH, `La bajada no puede superar los ${MAX_SUMMARY_LENGTH} caracteres.`)
  .optional();

export const CATEGORY_REQUIRED_MESSAGE = "Elegí una categoría.";
export const RATING_REQUIRED_MESSAGE = "Elegí un puntaje de 1 a 5.";
export const RATING_RANGE_MESSAGE = "El puntaje va de 1 a 5.";

// Un campo vacío llega como undefined (cliente) o "" (FormData del servidor):
// los dos son "falta elegir", no un error de tipo ni de rango. Sin esto,
// z.coerce convierte "" en 0 y el mensaje sería el de rango.
const categoryIdSchema = z
  .string({ error: CATEGORY_REQUIRED_MESSAGE })
  .trim()
  .min(1, CATEGORY_REQUIRED_MESSAGE);

const ratingSchema = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
  z
    .number({ error: RATING_REQUIRED_MESSAGE })
    .int(RATING_RANGE_MESSAGE)
    .min(1, RATING_RANGE_MESSAGE)
    .max(5, RATING_RANGE_MESSAGE),
);

const reviewContentSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.any()),
});

export const reviewFormSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio.").max(200),
  summary: summarySchema,
  venue: z.string().trim().max(200).optional(),
  eventDate: z.string().trim().optional(),
  categoryId: categoryIdSchema,
  rating: ratingSchema,
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
  summary: summarySchema,
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

export const interviewFormSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio.").max(200),
  summary: summarySchema,
  contentJson: z
    .string()
    .trim()
    .min(1, "El texto de la entrevista es obligatorio.")
    .transform((value, ctx) => {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "El contenido de la entrevista no es válido." });
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

export const interviewDraftFormSchema = z.object({
  title: z.string().trim().max(200).optional().default(""),
  summary: summarySchema,
  contentJson: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return undefined;

      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "El contenido de la entrevista no es válido." });
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

type ReviewKind = "critica" | "entrevista";

/**
 * Requisitos para que una crítica/entrevista esté publicada. Los borradores
 * pueden estar incompletos; esto se chequea al publicar y al guardar una ya
 * publicada. Devuelve un mensaje que dice qué falta, o null si está completa.
 */
export function getPublishError(
  kind: ReviewKind,
  fields: { summary: string | null | undefined; eventDate: string | null | undefined },
): string | null {
  const missing: string[] = [];

  if (!fields.summary?.trim()) missing.push("la bajada");
  if (kind === "critica" && !fields.eventDate) missing.push("la fecha de la función");

  if (missing.length === 0) return null;

  return `Para publicar falta completar ${missing.join(" y ")}.`;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
