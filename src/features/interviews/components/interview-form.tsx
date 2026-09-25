"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { saveInterviewDraftAction, type InterviewFormState } from "../actions";
import { ImageUploader, type ExistingImage } from "@/features/reviews/components/image-uploader";
import { TagsInput } from "@/features/reviews/components/tags-input";
import { TiptapEditor, type TiptapEditorHandle } from "@/features/reviews/components/tiptap-editor";
import { AutoResizeTitle } from "@/features/reviews/components/auto-resize-title";
import { SummaryField } from "@/features/reviews/components/summary-field";
import { interviewFormSchema } from "@/features/reviews/schema";

const AUTOSAVE_DEBOUNCE_MS = 4000;

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph", content: [] }] };

type InterviewDefaults = {
  title: string;
  summary: string;
  contentJson: unknown;
  tags: string;
  images: ExistingImage[];
};

const emptyDefaults: InterviewDefaults = {
  title: "",
  summary: "",
  contentJson: EMPTY_DOC,
  tags: "",
  images: [],
};

type FormValues = {
  title: string;
  summary?: string;
  contentJson: string;
  tags?: string;
};

export function InterviewForm({
  defaults = emptyDefaults,
  action,
  submitLabel,
  status,
  interviewId,
  interviewSlug,
}: {
  defaults?: InterviewDefaults;
  action: (state: InterviewFormState, formData: FormData) => Promise<InterviewFormState>;
  submitLabel: string;
  status?: "draft" | "published";
  interviewId?: string;
  interviewSlug?: string;
}) {
  const router = useRouter();
  const [state, formAction, isActionPending] = useActionState(action, {});
  const [isTransitionPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<TiptapEditorHandle>(null);
  const draftIdRef = useRef<string | null>(interviewId ?? null);
  const isSubmittingRef = useRef(false);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const [contentJson, setContentJson] = useState<unknown>(defaults.contentJson ?? EMPTY_DOC);
  const [plainText, setPlainText] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(interviewFormSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      title: defaults.title,
      summary: defaults.summary,
      contentJson: JSON.stringify(defaults.contentJson ?? EMPTY_DOC),
      tags: defaults.tags,
    },
  });

  const isPending = isActionPending || isTransitionPending;
  const isPublished = status === "published";
  const submitButtonLabel = isPublished ? "Guardar cambios (en vivo)" : submitLabel;
  const title = watch("title");
  const summary = watch("summary");
  const tags = watch("tags");
  const wordCount = useMemo(() => {
    const trimmed = plainText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [plainText]);

  // Depende de `state` (objeto nuevo en cada respuesta), no de `state.error`:
  // dos errores iguales seguidos también tienen que reactivar el autosave.
  useEffect(() => {
    if (state.error) {
      // La action devolvió un error sin navegar: el envío terminó, así que el
      // autosave (que se frena mientras hay un envío en curso) vuelve a andar.
      isSubmittingRef.current = false;
      toast.error(state.error);
    }
  }, [state]);

  function handleEditorChange(json: unknown, text: string) {
    setContentJson(json);
    setPlainText(text);
    setValue("contentJson", JSON.stringify(json), { shouldValidate: true });
  }

  useEffect(() => {
    const hasContent = Boolean(title?.trim() || plainText.trim());
    if (!hasContent) return;

    const timer = setTimeout(() => {
      if (isSubmittingRef.current) return;

      setAutosaveState("saving");
      const draftData = new FormData();
      draftData.set("title", title ?? "");
      draftData.set("summary", summary ?? "");
      draftData.set("contentJson", JSON.stringify(contentJson));
      draftData.set("tags", tags ?? "");

      saveInterviewDraftAction(draftIdRef.current, draftData)
        .then((result) => {
          if (isSubmittingRef.current) return;

          if ("error" in result) {
            // En una publicada, el error suele ser que falta la bajada:
            // mostramos el motivo en vez del genérico.
            setAutosaveError(isPublished ? result.error : null);
            setAutosaveState("error");
            return;
          }

          const isFirstSave = draftIdRef.current === null;
          draftIdRef.current = result.id;
          setAutosaveError(null);
          setAutosaveState("saved");

          if (isFirstSave && !interviewId) {
            router.replace(`/panel/entrevistas/${result.slug}`);
          }
        })
        .catch(() => {
          if (!isSubmittingRef.current) setAutosaveState("error");
        });
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, summary, contentJson, plainText, tags]);

  function onValid() {
    if (!formRef.current) return;
    isSubmittingRef.current = true;
    const formData = new FormData(formRef.current);
    startTransition(async () => {
      try {
        await formAction(formData);
      } catch {
        isSubmittingRef.current = false;
        toast.error(
          "No se pudo guardar la entrevista. Si subiste imágenes muy pesadas, probá con archivos más livianos.",
        );
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit(onValid)} noValidate className="pb-24">
      {status ? (
        <div className="mb-4 flex items-center gap-3 text-sm">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-medium",
              isPublished ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
            )}
          >
            {isPublished ? "Publicada · editando" : "Borrador"}
          </span>
          {isPublished && interviewSlug ? (
            <Link href={`/entrevista/${interviewSlug}`} className="text-primary underline underline-offset-2">
              Ver en el sitio
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_280px] lg:items-start">
        <div className="mx-auto min-w-0 max-w-[65ch]">
          <div className="px-6 sm:px-10">
            <Label htmlFor="title" className="sr-only">
              Título de la entrevista
            </Label>
            <AutoResizeTitle
              id="title"
              placeholder="Título de la entrevista"
              aria-invalid={Boolean(errors.title)}
              onEnter={() => editorRef.current?.focus()}
              {...register("title")}
            />
            {errors.title ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            ) : null}
          </div>

          <SummaryField
            className="mt-4 px-6 sm:px-10"
            length={summary?.length ?? 0}
            error={errors.summary?.message}
            {...register("summary")}
          />

          <div className="mt-6">
            <TiptapEditor
              ref={editorRef}
              content={defaults.contentJson ?? EMPTY_DOC}
              onChange={handleEditorChange}
              ariaLabel="Texto de la entrevista"
            />
          </div>
          <input type="hidden" {...register("contentJson")} />

          <p className="mt-2 px-6 text-xs text-muted-foreground sm:px-10">{wordCount} palabras</p>
          {errors.contentJson ? (
            <p role="alert" className="px-6 text-sm text-destructive sm:px-10">
              {errors.contentJson.message}
            </p>
          ) : null}
        </div>

        <div className="grid content-start gap-5">
          <div className="grid gap-1.5">
            <Label htmlFor="tags-input" className="text-xs">
              Palabras clave
            </Label>
            <TagsInput
              id="tags-input"
              value={tags ?? ""}
              onChange={(value) => setValue("tags", value, { shouldValidate: true })}
            />
            <input type="hidden" name="tags" value={tags ?? ""} />
          </div>

          <ImageUploader existingImages={defaults.images} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            {autosaveState === "saving" ? "Guardando…" : null}
            {autosaveState === "saved" ? "Guardado hace un momento" : null}
            {autosaveState === "error" ? (autosaveError ?? "No se pudo guardar el borrador. Reintentando…") : null}
          </span>
          <Button type="submit" disabled={isPending} className="justify-self-end">
            {isPending ? "Guardando…" : submitButtonLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
