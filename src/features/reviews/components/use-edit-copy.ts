"use client";

import { useEffect, useState, type RefObject } from "react";

import {
  clearEditCopy,
  readEditCopy,
  sameFields,
  writeEditCopy,
  type EditCopy,
  type EditCopyFields,
  type EditCopyKind,
} from "../edit-copy";

const WRITE_DEBOUNCE_MS = 300;

/**
 * Copia local de una crítica o entrevista publicada.
 *
 * - Mientras hay diferencias con el original, la copia se guarda en este
 *   navegador y se avisa al salir (beforeunload, salvo durante el envío).
 *   Si el formulario vuelve a ser igual al original, se borra la copia.
 * - Al abrir, si hay una copia con diferencias reales, queda como `pending`
 *   hasta que se elija recuperar o descartar (mientras tanto no se pisa).
 * - `originalFields` es null hasta que el editor entregó su documento
 *   normalizado: antes no se compara nada.
 * - Una copia de una publicada que volvió a borrador también se ofrece; al
 *   recuperarla, el autosave del borrador la guarda en el servidor.
 */
export function useEditCopy({
  kind,
  id,
  serverUpdatedAt,
  isPublished,
  originalFields,
  currentFields,
  isSubmittingRef,
}: {
  kind: EditCopyKind;
  id: string | undefined;
  serverUpdatedAt: string | undefined;
  isPublished: boolean;
  originalFields: EditCopyFields | null;
  currentFields: EditCopyFields;
  isSubmittingRef: RefObject<boolean>;
}) {
  const [pending, setPending] = useState<EditCopy | null>(null);
  const [checked, setChecked] = useState(false);

  const hasChanges = originalFields !== null && !sameFields(currentFields, originalFields);
  const isConflict = Boolean(
    pending && serverUpdatedAt && new Date(pending.baseUpdatedAt).getTime() < new Date(serverUpdatedAt).getTime(),
  );
  const currentKey = JSON.stringify(currentFields);

  // Al abrir: buscar una copia anterior con diferencias reales.
  useEffect(() => {
    if (!id || !originalFields || checked) return;

    const copy = readEditCopy(kind, id);

    if (copy && !sameFields(copy.fields, originalFields)) {
      setPending(copy);
    } else if (copy) {
      clearEditCopy(kind, id);
    }

    setChecked(true);
  }, [kind, id, originalFields, checked]);

  // Guardar (o borrar) la copia a medida que se edita una publicada.
  useEffect(() => {
    if (!id || !isPublished || !originalFields || !checked || pending) return;

    const timer = setTimeout(() => {
      if (!hasChanges) {
        clearEditCopy(kind, id);
        return;
      }

      writeEditCopy(kind, id, {
        version: 1,
        baseUpdatedAt: serverUpdatedAt ?? new Date(0).toISOString(),
        savedAt: new Date().toISOString(),
        fields: currentFields,
      });
    }, WRITE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // currentKey resume currentFields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, id, isPublished, originalFields, checked, pending, hasChanges, currentKey, serverUpdatedAt]);

  // Avisar al salir con cambios sin guardar, salvo mientras se envía el formulario.
  useEffect(() => {
    if (!isPublished || !hasChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (isSubmittingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isPublished, hasChanges, isSubmittingRef]);

  function recover(): EditCopyFields | null {
    if (!pending || !id) return null;

    const fields = pending.fields;
    setPending(null);

    // En un borrador, el autosave del servidor pasa a tener los cambios.
    if (!isPublished) clearEditCopy(kind, id);

    return fields;
  }

  function discard() {
    if (id) clearEditCopy(kind, id);
    setPending(null);
  }

  return { pending, isConflict, hasChanges, recover, discard };
}
