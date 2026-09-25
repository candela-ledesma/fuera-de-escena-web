/**
 * Limpia del store de Blob los archivos que subieron los E2E cuando la suite
 * usaba el store de producción. Solo toca los prefijos de abajo.
 *
 * Uso (lo corre una persona, no está conectado a ningún script de package.json):
 *
 *   BLOB_READ_WRITE_TOKEN='<token del store>' npx tsx scripts/cleanup-e2e-blobs.ts         # dry-run
 *   BLOB_READ_WRITE_TOKEN='<token del store>' npx tsx scripts/cleanup-e2e-blobs.ts --yes   # borra
 */
import { del, list, type ListBlobResultBlob } from "@vercel/blob";

import { getBlobStoreId } from "../src/lib/blob";

const PREFIXES = ["reviews/e2e-test-", "interviews/e2e-test-"] as const;
const EXAMPLES = 5;
const DELETE_BATCH = 100;

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

async function listPrefix(prefix: string): Promise<ListBlobResultBlob[]> {
  const found: ListBlobResultBlob[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    // Defensivo: nunca incluir algo fuera del prefijo, aunque la API lo devolviera.
    found.push(...page.blobs.filter((blob) => blob.pathname.startsWith(prefix)));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return found;
}

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((arg) => arg !== "--yes");

  if (unknown.length > 0) {
    throw new Error(`Argumentos desconocidos: ${unknown.join(" ")}. El único válido es --yes.`);
  }

  const shouldDelete = args.includes("--yes");
  const storeId = getBlobStoreId({ BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN });

  if (!storeId) {
    throw new Error("Falta BLOB_READ_WRITE_TOKEN (o tiene un formato desconocido). Pasalo al invocar el script.");
  }

  console.log(`Store: ${storeId}`);
  console.log(`Prefijos: ${PREFIXES.join(", ")}`);
  console.log(shouldDelete ? "Modo: BORRADO (--yes)\n" : "Modo: dry-run (no se borra nada; agregá --yes para borrar)\n");

  const blobs = (await Promise.all(PREFIXES.map(listPrefix))).flat();
  const totalBytes = blobs.reduce((sum, blob) => sum + blob.size, 0);

  for (const prefix of PREFIXES) {
    const count = blobs.filter((blob) => blob.pathname.startsWith(prefix)).length;
    console.log(`  ${prefix}*  ${count} archivos`);
  }

  console.log(`\nTotal: ${blobs.length} archivos, ${formatBytes(totalBytes)}`);

  if (blobs.length > 0) {
    console.log(`\nEjemplos:`);
    for (const blob of blobs.slice(0, EXAMPLES)) {
      console.log(`  ${blob.pathname}  (${formatBytes(blob.size)}, ${blob.uploadedAt.toISOString().slice(0, 10)})`);
    }
  }

  if (!shouldDelete || blobs.length === 0) return;

  let deleted = 0;
  for (let i = 0; i < blobs.length; i += DELETE_BATCH) {
    const batch = blobs.slice(i, i + DELETE_BATCH).map((blob) => blob.url);
    await del(batch);
    deleted += batch.length;
    console.log(`Borrados ${deleted}/${blobs.length}`);
  }

  console.log("\nListo.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
