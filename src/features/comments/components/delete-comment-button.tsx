"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { deleteCommentAction } from "../actions";

export function DeleteCommentButton({
  commentId,
  authorName,
}: {
  commentId: string;
  authorName: string;
}) {
  return (
    <div className="mt-2">
      <ConfirmDialog
        title="Borrar comentario"
        description={`Vas a borrar el comentario de ${authorName}. Esta acción no se puede deshacer.`}
        onConfirm={() => {
          void deleteCommentAction(commentId);
        }}
        trigger={
          <button
            type="button"
            className="text-xs text-destructive hover:underline"
            aria-label={`Borrar comentario de ${authorName}`}
          >
            Borrar
          </button>
        }
      />
    </div>
  );
}
