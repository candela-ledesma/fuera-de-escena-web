"use client";

import { useActionState } from "react";

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

import type { ReviewFormState } from "../actions";

type Category = { id: string; name: string };

type ReviewDefaults = {
  title: string;
  venue: string;
  eventDate: string;
  categoryId: string;
  rating: string;
  body: string;
  tags: string;
};

const emptyDefaults: ReviewDefaults = {
  title: "",
  venue: "",
  eventDate: "",
  categoryId: "",
  rating: "",
  body: "",
  tags: "",
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
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid max-w-2xl gap-5" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="title">Título de la obra</Label>
        <Input id="title" name="title" defaultValue={defaults.title} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="venue">Teatro / lugar</Label>
          <Input id="venue" name="venue" defaultValue={defaults.venue} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="eventDate">Fecha de la función</Label>
          <Input id="eventDate" name="eventDate" type="date" defaultValue={defaults.eventDate} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="categoryId">Categoría</Label>
          <Select name="categoryId" defaultValue={defaults.categoryId}>
            <SelectTrigger id="categoryId">
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
        </div>

        <div className="grid gap-2">
          <Label htmlFor="rating">Valoración (1 a 5)</Label>
          <Select name="rating" defaultValue={defaults.rating}>
            <SelectTrigger id="rating">
              <SelectValue placeholder="Elegí un puntaje" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value} {value === 1 ? "estrella" : "estrellas"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="body">Texto de la crítica</Label>
        <Textarea id="body" name="body" rows={10} defaultValue={defaults.body} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="tags">Palabras clave</Label>
        <Input
          id="tags"
          name="tags"
          placeholder="drama, teatro independiente, unipersonal"
          defaultValue={defaults.tags}
        />
        <p className="text-sm text-muted-foreground">Separadas por coma.</p>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="justify-self-start">
        {isPending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
