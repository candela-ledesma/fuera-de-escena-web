import { deleteCommentAction } from "../actions";

type CommentItem = {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
};

export function CommentList({
  comments,
  canModerate,
}: {
  comments: CommentItem[];
  canModerate: boolean;
}) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay comentarios.</p>;
  }

  return (
    <ul className="grid gap-4">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-md border border-border bg-secondary/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">{comment.authorName}</span>
            <time className="text-xs text-muted-foreground" dateTime={comment.createdAt.toISOString()}>
              {comment.createdAt.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
            </time>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>

          {canModerate ? (
            <form
              action={async () => {
                "use server";
                await deleteCommentAction(comment.id);
              }}
              className="mt-2"
            >
              <button
                type="submit"
                className="text-xs text-destructive hover:underline"
                aria-label={`Borrar comentario de ${comment.authorName}`}
              >
                Borrar
              </button>
            </form>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
