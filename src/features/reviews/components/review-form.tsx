"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { ReviewFormState } from "../actions";
import { saveDraftAction } from "../actions";
import { reviewFormSchema } from "../schema";
import { ImageUploader, type ExistingImage } from "./image-uploader";
import { StarRating } from "./star-rating";
import { TagsInput } from "./tags-input";

const AUTOSAVE_DEBOUNCE_MS = 4000;

type Category = { id: string; name: string };

type ReviewDefaults = {
  title: string;
  venue: string;
  eventDate: string;
  categoryId: string;
  rating: string;
  body: string;
  tags: string;
  images: ExistingImage[];
};

const emptyDefaults: ReviewDefaults = {
  title: "",
  venue: "",
  eventDate: "",
  categoryId: "",
  rating: "",
  body: "",
  tags: "",
  images: [],
};

type FormValues = {
  title: string;
  venue?: string;
  eventDate?: string;
  categoryId: string;
  rating: number | undefined;
  body: string;
  tags?: string;
};

export function ReviewForm({
  categories,
  defaults = emptyDefaults,
  action,
  submitLabel,
  status,
  reviewId,
  reviewSlug,
}: {
  categories: Category[];
  defaults?: ReviewDefaults;
  action: (state: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;
  submitLabel: string;
  status?: "draft" | "published";
  reviewId?: string;
  reviewSlug?: string;
}) {
  const router = useRouter();
  const [state, formAction, isActionPending] = useActionState(action, {});
  const [isTransitionPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const draftIdRef = useRef<string | null>(reviewId ?? null);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(reviewFormSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      title: defaults.title,
      venue: defaults.venue,
      eventDate: defaults.eventDate,
      categoryId: defaults.categoryId || undefined,
      rating: defaults.rating ? Number(defaults.rating) : undefined,
      body: defaults.body,
      tags: defaults.tags,
    },
  });

  const isPending = isActionPending || isTransitionPending;
  const isPublished = status === "published";
  const submitButtonLabel = isPublished ? "Guardar cambios (en vivo)" : submitLabel;
  const title = watch("title");
  const venue = watch("venue");
  const eventDate = watch("eventDate");
  const rating = watch("rating");
  const categoryId = watch("categoryId");
  const body = watch("body");
  const tags = watch("tags");
  const wordCount = useMemo(() => {
    const trimmed = body?.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [body]);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  useEffect(() => {
    const hasContent = Boolean(title?.trim() || body?.trim());
    if (!hasContent) return;

    const timer = setTimeout(() => {
      setAutosaveState("saving");
      const draftData = new FormData();
      draftData.set("title", title ?? "");
      draftData.set("venue", venue ?? "");
      draftData.set("eventDate", eventDate ?? "");
      draftData.set("categoryId", categoryId ?? "");
      draftData.set("rating", rating ? String(rating) : "");
      draftData.set("body", body ?? "");
      draftData.set("tags", tags ?? "");

      saveDraftAction(draftIdRef.current, draftData)
        .then((result) => {
          if ("error" in result) {
            setAutosaveState("error");
            return;
          }

          const isFirstSave = draftIdRef.current === null;
          draftIdRef.current = result.id;
          setAutosaveState("saved");

          if (isFirstSave && !reviewId) {
            router.replace(`/panel/criticas/${result.slug}`);
          }
        })
        .catch(() => setAutosaveState("error"));
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, venue, eventDate, categoryId, rating, body, tags]);

  function onValid() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    startTransition(async () => {
      try {
        await formAction(formData);
      } catch {
        // Un error no controlado del servidor (ej. límite de tamaño del
        // request, timeout, corte de red) no debe crashear la página con
        // el error genérico de Next.js: mostramos un mensaje accionable.
        toast.error(
          "No se pudo guardar la crítica. Si subiste imágenes muy pesadas, probá con archivos más livianos.",
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
          {isPublished && reviewSlug ? (
            <Link href={`/critica/${reviewSlug}`} className="text-primary underline underline-offset-2">
              Ver en el sitio
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_280px]">
        {/* Columna principal: el editor */}
        <div className="min-w-0">
          <div className="grid gap-2">
            <Label htmlFor="title" className="sr-only">
              Título de la obra
            </Label>
            <Input
              id="title"
              placeholder="Título de la obra"
              aria-invalid={Boolean(errors.title)}
              className="h-auto border-none bg-transparent px-0 font-display text-3xl shadow-none focus-visible:ring-0 sm:text-4xl"
              {...register("title")}
            />
            {errors.title ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            ) : null}
          </div>

          {/* Barra de formato (placeholder, se cablea en la Parte 2) */}
          <div
            className="sticky top-0 z-10 mt-4 flex h-11 items-center gap-1 rounded-t-lg border border-b-0 border-border bg-card px-3 text-sm text-muted-foreground"
            aria-hidden="true"
          >
            Formato de texto (próximamente)
          </div>

          <div className="rounded-b-lg border border-border bg-card px-6 py-8 sm:px-10">
            <div className="mx-auto max-w-[65ch]">
              <Label htmlFor="body" className="sr-only">
                Texto de la crítica
              </Label>
              <Textarea
                id="body"
                className="min-h-[40vh] resize-none border-none bg-transparent px-0 shadow-none focus-visible:ring-0 lg:min-h-[60vh]"
                placeholder="Escribí tu crítica…"
                aria-invalid={Boolean(errors.body)}
                {...register("body")}
              />
            </div>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">{wordCount} palabras</p>
          {errors.body ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.body.message}
            </p>
          ) : null}
        </div>

        {/* Barra lateral: metadatos */}
        <div className="grid content-start gap-5">
          <div className="grid gap-1.5">
            <Label htmlFor="venue" className="text-xs">
              Teatro / lugar
            </Label>
            <Input id="venue" className="h-9 text-sm" {...register("venue")} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="eventDate" className="text-xs">
              Fecha de la función
            </Label>
            <Input id="eventDate" type="date" className="h-9 text-sm" {...register("eventDate")} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="categoryId" className="text-xs">
              Categoría
            </Label>
            <Select
              value={categoryId}
              onValueChange={(value) => setValue("categoryId", value, { shouldValidate: true })}
            >
              <SelectTrigger
                id="categoryId"
                className="h-9 w-full text-sm"
                aria-invalid={Boolean(errors.categoryId)}
              >
                <SelectValue placeholder="Elegí una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="categoryId" value={categoryId ?? ""} />
            {errors.categoryId ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.categoryId.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <StarRating
              value={rating}
              onChange={(value) => setValue("rating", value, { shouldValidate: true })}
            />
            <input type="hidden" name="rating" value={rating ?? ""} />
            {errors.rating ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.rating.message}
              </p>
            ) : null}
          </div>

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
            {autosaveState === "error" ? "No se pudo guardar el borrador. Reintentando…" : null}
          </span>
          <Button type="submit" disabled={isPending} className="justify-self-end">
            {isPending ? "Guardando…" : submitButtonLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
