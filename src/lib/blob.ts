import { del } from "@vercel/blob";

/**
 * Resguardo para no borrar archivos de otro store de Blob.
 *
 * Las bases dev y test son copias de producción: sus filas apuntan a imágenes
 * del store de producción. Si local o un preview borraran esas URLs con sus
 * credenciales, eliminarían los archivos reales. Solo se borran las URLs cuyo
 * host es el del store con el que corre la app.
 */

const LOG_PREFIX = "[blob-guard]";
const READ_WRITE_TOKEN_PATTERN = /^vercel_blob_rw_([A-Za-z0-9]+)_[A-Za-z0-9]+$/;

/**
 * Id del store con el que corre la app. En Vercel viene en BLOB_STORE_ID
 * ("store_<id>", auth por OIDC). En local, dentro de BLOB_READ_WRITE_TOKEN
 * ("vercel_blob_rw_<id>_<secreto>"). Si el formato es desconocido, null.
 */
export function getBlobStoreId(env: Record<string, string | undefined> = process.env): string | null {
  const storeIdEnv = env.BLOB_STORE_ID?.trim();

  if (storeIdEnv) {
    const id = storeIdEnv.replace(/^store_/, "");
    return /^[A-Za-z0-9]+$/.test(id) ? id : null;
  }

  const token = env.BLOB_READ_WRITE_TOKEN?.trim();
  const match = token ? READ_WRITE_TOKEN_PATTERN.exec(token) : null;

  return match ? match[1] : null;
}

/** El subdominio de Blob viene en minúsculas y el id no: se compara sin distinguir mayúsculas. */
export function isBlobUrlFromStore(url: string, storeId: string): boolean {
  let hostname: string;

  try {
    hostname = new URL(url).hostname;
  } catch {
    return false;
  }

  return hostname.toLowerCase() === `${storeId.toLowerCase()}.public.blob.vercel-storage.com`;
}

/** Borra solo las URLs del store propio. Las ajenas se saltean con un aviso en el log. */
export async function deleteOwnBlobs(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  const storeId = getBlobStoreId();

  if (!storeId) {
    console.warn(`${LOG_PREFIX} No se pudo determinar el store de Blob: no se borra ningún archivo.`, {
      skipped: urls.length,
    });
    return;
  }

  const own: string[] = [];

  for (const url of urls) {
    if (isBlobUrlFromStore(url, storeId)) {
      own.push(url);
    } else {
      console.warn(`${LOG_PREFIX} Se saltea un archivo de otro store: ${url}`);
    }
  }

  if (own.length > 0) {
    await del(own);
  }
}
