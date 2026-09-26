/**
 * Copia local (localStorage) de los cambios sin guardar de una crítica o
 * entrevista publicada. Las publicadas no se autoguardan en el servidor
 * (se verían en vivo a medio escribir), así que esta copia evita perder
 * trabajo si se cierra la pestaña. Solo campos de texto: las imágenes no
 * entran. En este navegador únicamente.
 */

export type EditCopyKind = "critica" | "entrevista";

/** Campos de texto del formulario, serializados como strings (contentJson es JSON). */
export type EditCopyFields = Record<string, string>;

export type EditCopy = {
  version: 1;
  /** updatedAt de la fila cuando se empezó a editar: detecta si después cambió en el servidor. */
  baseUpdatedAt: string;
  savedAt: string;
  fields: EditCopyFields;
};

// Por tipo e id (no por slug, que puede cambiar).
export function editCopyKey(kind: EditCopyKind, id: string): string {
  return `fde:edit-copy:${kind}:${id}`;
}

function isEditCopy(value: unknown): value is EditCopy {
  if (!value || typeof value !== "object") return false;

  const copy = value as Partial<EditCopy>;

  return (
    copy.version === 1 &&
    typeof copy.baseUpdatedAt === "string" &&
    typeof copy.savedAt === "string" &&
    !!copy.fields &&
    typeof copy.fields === "object" &&
    Object.values(copy.fields).every((field) => typeof field === "string")
  );
}

// localStorage puede no existir o fallar (modo privado, cuota): nunca rompe el formulario.
export function readEditCopy(kind: EditCopyKind, id: string): EditCopy | null {
  try {
    const raw = window.localStorage.getItem(editCopyKey(kind, id));
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    return isEditCopy(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeEditCopy(kind: EditCopyKind, id: string, copy: EditCopy): void {
  try {
    window.localStorage.setItem(editCopyKey(kind, id), JSON.stringify(copy));
  } catch {
    // Sin copia local: el aviso de beforeunload sigue protegiendo.
  }
}

export function clearEditCopy(kind: EditCopyKind, id: string): void {
  try {
    window.localStorage.removeItem(editCopyKey(kind, id));
  } catch {
    // Nada que hacer.
  }
}

export function sameFields(a: EditCopyFields, b: EditCopyFields): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of keys) {
    if ((a[key] ?? "") !== (b[key] ?? "")) return false;
  }

  return true;
}
