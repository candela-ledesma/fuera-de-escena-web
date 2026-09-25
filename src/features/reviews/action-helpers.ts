import { put } from "@vercel/blob";

import { findTagsByName, insertTags, slugExists } from "./queries";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, MAX_REVIEW_IMAGES, slugify } from "./schema";

// Helpers compartidos por las Server Actions de críticas y entrevistas.
// Sin "use server" a propósito: en un archivo con esa directiva cada export
// se vuelve un endpoint invocable desde el cliente.

export async function resolveUniqueSlug(title: string, excludeReviewId?: string) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;

  while (await slugExists(candidate, excludeReviewId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function resolveTagIds(tagNames: string[]) {
  if (tagNames.length === 0) return [];

  const existing = await findTagsByName(tagNames);
  const existingNames = new Set(existing.map((tag) => tag.name));
  const missingNames = tagNames.filter((name) => !existingNames.has(name));

  const created = await insertTags(missingNames.map((name) => ({ name, slug: slugify(name) })));

  return [...existing, ...created].map((tag) => tag.id);
}

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Las imágenes deben ser JPG, PNG o WEBP.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Cada imagen debe pesar menos de 5MB.";
  }

  return null;
}

/**
 * Reconstruye la lista final de imágenes en el orden exacto en que el
 * ImageUploader las mostraba al momento del submit. El uploader manda un
 * campo "imageOrder" por slot ("new" o "existing:<storagePath>"), en orden,
 * junto con los <input type="file" name="images"> de las nuevas (en ese
 * mismo orden relativo entre sí) y un "imageAlts" por slot. Esto permite
 * distinguir "no se tocaron las imágenes" (sin campo imageOrder) de "se
 * quedó sin imágenes" (imageOrder presente pero vacío), y sobre todo permite
 * saber qué imágenes existentes se borraron para poder eliminarlas.
 */
export async function resolveFinalImages(
  formData: FormData,
  slug: string,
  coverIndex: number,
  blobFolder: "reviews" | "interviews",
): Promise<{ images: { storagePath: string; altText: string; position: number; isCover: boolean }[] } | { error: string }> {
  const order = formData.getAll("imageOrder").map((entry) => String(entry));
  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const altTexts = formData.getAll("imageAlts").map((entry) => String(entry));

  if (order.length > MAX_REVIEW_IMAGES) {
    return { error: `Máximo ${MAX_REVIEW_IMAGES} imágenes.` };
  }

  for (const file of files) {
    const error = validateImageFile(file);
    if (error) return { error };
  }

  let fileIndex = 0;
  const storagePaths = await Promise.all(
    order.map(async (entry, index) => {
      if (entry === "new") {
        const file = files[fileIndex];
        fileIndex += 1;
        const blob = await put(`${blobFolder}/${slug}-${Date.now()}-${index}`, file, {
          access: "public",
          addRandomSuffix: true,
        });
        return blob.url;
      }

      return entry.slice("existing:".length);
    }),
  );

  const images = storagePaths.map((storagePath, index) => ({
    storagePath,
    altText: altTexts[index] ?? "",
    position: index + 1,
    isCover: index === coverIndex,
  }));

  return { images };
}
