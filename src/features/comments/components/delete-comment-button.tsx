"use client";

export function DeleteCommentButton({ authorName }: { authorName: string }) {
  return (
    <button
      type="submit"
      className="text-xs text-destructive hover:underline"
      aria-label={`Borrar comentario de ${authorName}`}
      onClick={(event) => {
        if (!confirm(`¿Seguro que querés borrar el comentario de ${authorName}?`)) {
          event.preventDefault();
        }
      }}
    >
      Borrar
    </button>
  );
}
