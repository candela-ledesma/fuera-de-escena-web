"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import type { EditCopyKind } from "../edit-copy";

const NOUN: Record<EditCopyKind, { article: string; noun: string }> = {
  critica: { article: "La", noun: "crítica" },
  entrevista: { article: "La", noun: "entrevista" },
};

function formatSavedAt(value: string): string {
  return new Date(value).toLocaleString("es-AR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EditCopyBanner({
  kind,
  savedAt,
  isConflict,
  onRecover,
  onDiscard,
}: {
  kind: EditCopyKind;
  savedAt: string;
  isConflict: boolean;
  onRecover: () => void;
  onDiscard: () => void;
}) {
  const { article, noun } = NOUN[kind];

  return (
    <div
      role="region"
      aria-label="Cambios sin guardar"
      data-testid="edit-copy-banner"
      className="mb-6 rounded-lg border border-primary bg-secondary px-4 py-3 text-sm"
    >
      <p className="font-medium text-foreground">
        Tenés cambios sin guardar de esta {noun} en este navegador ({formatSavedAt(savedAt)}).
      </p>
      <p className="mt-1 text-muted-foreground">
        Solo se recuperan los textos: las imágenes no se incluyen en la copia. No se guarda nada hasta que hagas
        clic en &laquo;Guardar cambios&raquo;.
      </p>

      {isConflict ? (
        <p role="alert" className="mt-2 font-medium text-destructive">
          {article} {noun} se modificó después de estos cambios. Si los recuperás, reemplazan esa versión en el
          formulario.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {isConflict ? (
          <ConfirmDialog
            trigger={
              <Button type="button" size="sm">
                Recuperar igual
              </Button>
            }
            title="¿Recuperar cambios anteriores?"
            description={`${article} ${noun} se modificó después de estos cambios. Al recuperarlos, reemplazan esa versión en el formulario (todavía no se guarda nada).`}
            confirmLabel="Recuperar"
            onConfirm={onRecover}
          />
        ) : (
          <Button type="button" size="sm" onClick={onRecover}>
            Recuperar
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={onDiscard}>
          Descartar
        </Button>
      </div>
    </div>
  );
}
