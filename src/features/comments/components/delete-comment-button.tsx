"use client";

import { useRef } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteCommentButton({ authorName }: { authorName: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <ConfirmDialog
      title="Borrar comentario"
      description={`Vas a borrar el comentario de ${authorName}. Esta acción no se puede deshacer.`}
      onConfirm={() => {
        buttonRef.current?.form?.requestSubmit();
      }}
      trigger={
        <button
          ref={buttonRef}
          type="button"
          className="text-xs text-destructive hover:underline"
          aria-label={`Borrar comentario de ${authorName}`}
        >
          Borrar
        </button>
      }
    />
  );
}
