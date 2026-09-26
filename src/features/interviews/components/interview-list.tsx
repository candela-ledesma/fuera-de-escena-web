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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { deleteInterviewAction, setInterviewStatusAction } from "../actions";
import { clearEditCopy } from "@/features/reviews/edit-copy";

type InterviewListItem = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  updatedAt: Date;
  viewCount: number;
  commentsCount: number;
  reactionsCount: number;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
};

type StatusFilter = "all" | "published" | "draft";
type SortOrder = "recent" | "popular";

export function InterviewList({ interviews }: { interviews: InterviewListItem[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");

  const visibleInterviews = useMemo(() => {
    const filtered =
      statusFilter === "all" ? interviews : interviews.filter((interview) => interview.status === statusFilter);

    return [...filtered].sort((a, b) =>
      sortOrder === "popular"
        ? b.viewCount - a.viewCount
        : b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }, [interviews, statusFilter, sortOrder]);

  if (interviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="font-display text-lg text-foreground">Todavía no hay entrevistas cargadas.</p>
        <p className="mt-1 text-sm text-muted-foreground">Creá tu primera entrevista para verla acá.</p>
        <Button asChild className="mt-4">
          <Link href="/panel/entrevistas/nueva">Escribir una entrevista</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="published">Publicadas</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Ordenar por">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Más recientes</SelectItem>
            <SelectItem value="popular">Más populares</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visibleInterviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No hay entrevistas para este filtro.</p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {visibleInterviews.map((interview) => (
            <InterviewRow key={interview.id} interview={interview} />
          ))}
        </ul>
      )}
    </div>
  );
}

function InterviewRow({ interview }: { interview: InterviewListItem }) {
  const [isPending, startTransition] = useTransition();

  function handleTogglePublish() {
    startTransition(async () => {
      const nextStatus = interview.status === "published" ? "draft" : "published";
      const result = await setInterviewStatusAction(interview.slug, nextStatus);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(nextStatus === "published" ? "Entrevista publicada." : "Entrevista pasada a borrador.");
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteInterviewAction(interview.slug);
      clearEditCopy("entrevista", interview.id);
      toast.success("Entrevista borrada.");
    });
  }

  return (
    <li
      data-testid="interview-card"
      className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
          {interview.coverImageUrl ? (
            <Image
              src={interview.coverImageUrl}
              alt={interview.coverImageAlt ?? interview.title}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 break-words font-medium line-clamp-2">{interview.title}</h3>
            <Badge className="shrink-0" variant={interview.status === "published" ? "default" : "secondary"}>
              {interview.status === "published" ? "Publicada" : "Borrador"}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" aria-label={`${interview.viewCount} vistas`}>
              <Eye className="size-3.5" aria-hidden="true" />
              {interview.viewCount}
            </span>
            <span className="flex items-center gap-1" aria-label={`${interview.commentsCount} comentarios`}>
              <MessageCircle className="size-3.5" aria-hidden="true" />
              {interview.commentsCount}
            </span>
            <span className="flex items-center gap-1" aria-label={`${interview.reactionsCount} reacciones`}>
              <Heart className="size-3.5" aria-hidden="true" />
              {interview.reactionsCount}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/panel/entrevistas/${interview.slug}`}>Editar</Link>
        </Button>

        {interview.status === "published" ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/entrevista/${interview.slug}`} target="_blank" rel="noopener noreferrer">
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
              {interview.status === "published" ? "Pasar a borrador" : "Publicar"}
            </DropdownMenuItem>

            <ConfirmDialog
              title="¿Borrar esta entrevista?"
              description={`Esta acción no se puede deshacer. Se va a borrar "${interview.title}" y sus imágenes de forma permanente.`}
              onConfirm={handleDelete}
              trigger={
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isPending}
                  onSelect={(event) => event.preventDefault()}
                >
                  Borrar
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
