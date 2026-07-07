"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { deleteReviewAction, setReviewStatusAction } from "../actions";

type ReviewListItem = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  rating: number | null;
  venue: string | null;
  eventDate: string | null;
  updatedAt: Date;
  viewCount: number;
  commentsCount: number;
  reactionsCount: number;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
};

type StatusFilter = "all" | "published" | "draft";
type SortOrder = "recent" | "popular";

export function ReviewList({ reviews }: { reviews: ReviewListItem[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");

  const visibleReviews = useMemo(() => {
    const filtered =
      statusFilter === "all" ? reviews : reviews.filter((review) => review.status === statusFilter);

    return [...filtered].sort((a, b) =>
      sortOrder === "popular"
        ? b.viewCount - a.viewCount
        : b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }, [reviews, statusFilter, sortOrder]);

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="font-display text-lg text-foreground">Todavía no hay críticas cargadas.</p>
        <p className="mt-1 text-sm text-muted-foreground">Creá tu primera crítica para verla acá.</p>
        <Button asChild className="mt-4">
          <Link href="/panel/criticas/nueva">Nueva crítica</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="w-[160px]" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="published">Publicadas</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
          <SelectTrigger className="w-[160px]" aria-label="Ordenar por">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Más recientes</SelectItem>
            <SelectItem value="popular">Más populares</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visibleReviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No hay críticas para este filtro.</p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {visibleReviews.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewRow({ review }: { review: ReviewListItem }) {
  const [isPending, startTransition] = useTransition();

  function handleTogglePublish() {
    startTransition(async () => {
      const nextStatus = review.status === "published" ? "draft" : "published";
      await setReviewStatusAction(review.slug, nextStatus);
      toast.success(nextStatus === "published" ? "Crítica publicada." : "Crítica pasada a borrador.");
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteReviewAction(review.slug);
      toast.success("Crítica borrada.");
    });
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
          {review.coverImageUrl ? (
            <Image
              src={review.coverImageUrl}
              alt={review.coverImageAlt ?? review.title}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : null}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{review.title}</h3>
            <Badge variant={review.status === "published" ? "default" : "secondary"}>
              {review.status === "published" ? "Publicada" : "Borrador"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {review.venue ? `${review.venue} · ` : ""}
            {review.rating ? `${review.rating}★` : "Sin puntaje"}
          </p>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" aria-label={`${review.viewCount} vistas`}>
              <Eye className="size-3.5" aria-hidden="true" />
              {review.viewCount}
            </span>
            <span className="flex items-center gap-1" aria-label={`${review.commentsCount} comentarios`}>
              <MessageCircle className="size-3.5" aria-hidden="true" />
              {review.commentsCount}
            </span>
            <span className="flex items-center gap-1" aria-label={`${review.reactionsCount} reacciones`}>
              <Heart className="size-3.5" aria-hidden="true" />
              {review.reactionsCount}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/panel/criticas/${review.slug}`}>Editar</Link>
        </Button>

        {review.status === "published" ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/critica/${review.slug}`} target="_blank" rel="noopener noreferrer">
              Ver publicación
            </Link>
          </Button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" disabled={isPending} aria-label="Más acciones">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleTogglePublish} disabled={isPending}>
              {review.status === "published" ? "Pasar a borrador" : "Publicar"}
            </DropdownMenuItem>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isPending}
                  onSelect={(event) => event.preventDefault()}
                >
                  Borrar
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Borrar esta crítica?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se va a borrar &ldquo;{review.title}&rdquo; y sus
                    imágenes de forma permanente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Borrar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
