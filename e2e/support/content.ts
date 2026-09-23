import { eq, inArray } from "drizzle-orm";

import { db } from "../../src/lib/db/client";
import { authors, categories, reviews } from "../../src/lib/db/schema";

import { TEST_EMAIL } from "./auth";

// Publicadas en el futuro lejano: siempre son las más recientes, sin
// importar qué más haya publicado. Cada una un minuto después de la anterior.
const FUTURE_BASE = Date.UTC(2099, 0, 1);
let sequence = 0;

export function futurePublishedAt(): Date {
  sequence += 1;
  return new Date(FUTURE_BASE + sequence * 60_000);
}

function plainTextDoc(text: string) {
  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] };
}

export async function getTestAuthor() {
  const [author] = await db
    .select({ id: authors.id, displayName: authors.displayName })
    .from(authors)
    .where(eq(authors.email, TEST_EMAIL!))
    .limit(1);

  if (!author) throw new Error(`No existe la autora de prueba ${TEST_EMAIL} en la base test.`);

  return author;
}

type CreateOptions = {
  kind?: "critica" | "entrevista";
  status?: "draft" | "published";
  title?: string;
  summary?: string | null;
  venue?: string | null;
  eventDate?: string | null;
  rating?: number | null;
  publishedAt?: Date;
};

/** Crea contenido de prueba y registra su id para `cleanup()`. */
export class ContentFixtures {
  private ids: string[] = [];

  async create(options: CreateOptions = {}) {
    const kind = options.kind ?? "critica";
    const status = options.status ?? "published";
    const author = await getTestAuthor();
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const title = options.title ?? `E2E TEST — ${kind === "critica" ? "Crítica" : "Entrevista"} ${unique}`;
    const isReview = kind === "critica";

    const [row] = await db
      .insert(reviews)
      .values({
        authorId: author.id,
        kind,
        title,
        slug: `e2e-${kind}-${unique}`,
        summary: options.summary === undefined ? "Bajada de prueba E2E." : options.summary,
        venue: isReview ? (options.venue === undefined ? "Sala E2E" : options.venue) : null,
        eventDate: isReview ? (options.eventDate === undefined ? "2026-06-15" : options.eventDate) : null,
        rating: isReview ? (options.rating === undefined ? 4 : options.rating) : null,
        categoryId: isReview ? category?.id ?? null : null,
        body: "Cuerpo de prueba.",
        contentJson: plainTextDoc("Cuerpo de prueba."),
        status,
        publishedAt: status === "published" ? (options.publishedAt ?? futurePublishedAt()) : null,
      })
      .returning({ id: reviews.id, slug: reviews.slug, title: reviews.title });

    this.ids.push(row.id);

    return row;
  }

  async getSummaryAndDate(id: string) {
    const [row] = await db
      .select({ summary: reviews.summary, eventDate: reviews.eventDate, status: reviews.status })
      .from(reviews)
      .where(eq(reviews.id, id));

    return row;
  }

  async cleanup() {
    if (this.ids.length === 0) return;

    await db.delete(reviews).where(inArray(reviews.id, this.ids));
    this.ids = [];
  }
}
