"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createCommentAction } from "../actions";

export function CommentForm({ reviewSlug }: { reviewSlug: string }) {
  const action = createCommentAction.bind(null, reviewSlug);
  const [state, formAction, isPending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const submitCount = useRef(0);

  useEffect(() => {
    if (submitCount.current === 0) return;

    if (state.error) {
      toast.error(state.error);
    } else {
      formRef.current?.reset();
      toast.success("Comentario publicado.");
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        submitCount.current += 1;
        formAction(formData);
      }}
      className="grid gap-3"
    >
      <div className="grid gap-2">
        <Label htmlFor="authorName">Tu nombre</Label>
        <Input id="authorName" name="authorName" placeholder="Tu nombre (opcional)" maxLength={80} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="body">Comentario</Label>
        <Textarea id="body" name="body" rows={4} maxLength={2000} required />
      </div>

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />

      <Button type="submit" disabled={isPending} className="justify-self-start">
        {isPending ? "Publicando…" : "Publicar comentario"}
      </Button>
    </form>
  );
}
