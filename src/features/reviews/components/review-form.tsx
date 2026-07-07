"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
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
import { reviewFormSchema } from "../schema";
import { ImageUploader, type ExistingImage } from "./image-uploader";

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
}: {
  categories: Category[];
  defaults?: ReviewDefaults;
  action: (state: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;
  submitLabel: string;
}) {
  const [state, formAction, isActionPending] = useActionState(action, {});
  const [isTransitionPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

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
  const rating = watch("rating");
  const categoryId = watch("categoryId");

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

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
    <form
      ref={formRef}
      onSubmit={handleSubmit(onValid)}
      className="grid max-w-2xl gap-6"
      noValidate
    >
      <div className="grid gap-2">
        <Label htmlFor="title">Título de la obra</Label>
        <Input id="title" aria-invalid={Boolean(errors.title)} {...register("title")} />
        {errors.title ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="venue">Teatro / lugar</Label>
          <Input id="venue" {...register("venue")} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="eventDate">Fecha de la función</Label>
          <Input id="eventDate" type="date" {...register("eventDate")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="categoryId">Categoría</Label>
          <Select
            value={categoryId}
            onValueChange={(value) => setValue("categoryId", value, { shouldValidate: true })}
          >
            <SelectTrigger id="categoryId" aria-invalid={Boolean(errors.categoryId)}>
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

        <div className="grid gap-2">
          <Label id="rating-label">Valoración (1 a 5)</Label>
          <div role="radiogroup" aria-labelledby="rating-label" className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
                onClick={() => setValue("rating", value, { shouldValidate: true })}
                className="rounded-sm p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star
                  className={cn(
                    "size-7 transition-colors",
                    rating && value <= rating
                      ? "fill-primary text-primary"
                      : "fill-transparent text-muted-foreground",
                  )}
                />
              </button>
            ))}
          </div>
          <input type="hidden" name="rating" value={rating ?? ""} />
          {errors.rating ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.rating.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="body">Texto de la crítica</Label>
        <Textarea id="body" rows={10} aria-invalid={Boolean(errors.body)} {...register("body")} />
        {errors.body ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.body.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="tags">Palabras clave</Label>
        <Input
          id="tags"
          placeholder="drama, teatro independiente, unipersonal"
          {...register("tags")}
        />
        <p className="text-sm text-muted-foreground">Separadas por coma.</p>
      </div>

      <ImageUploader existingImages={defaults.images} />

      <Button type="submit" disabled={isPending} className="justify-self-start sm:justify-self-end">
        {isPending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
