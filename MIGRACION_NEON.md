# Migración de Supabase a Neon — plan

## Motivo

Bug confirmado de infraestructura de Supabase: PostgREST rechaza con `42501`
cualquier INSERT/UPDATE autenticado que dependa de `auth.uid()` en RLS, a
pesar de que el JWT es válido (`role: authenticated`, firma correcta, `sub`
coincidente). Reproducido en dos proyectos Supabase distintos, con ambos
sistemas de API keys, y aislado con `curl` puro sin pasar por Next.js — es
100% un bug del lado de Supabase, no de este código.

## Stack de reemplazo

| Pieza | Antes (Supabase) | Ahora (Neon) |
|---|---|---|
| Postgres | Supabase Postgres | **Neon** (serverless Postgres) |
| ORM / acceso a datos | supabase-js (`.from().select()`) | **Drizzle ORM** |
| Auth | Supabase Auth (email+password) | **Auth.js / NextAuth** (Credentials provider) |
| Storage de imágenes | Supabase Storage (bucket `review-images`) | **Vercel Blob** |
| Autorización | RLS (Row Level Security) en policies SQL | Checks explícitos en `actions.ts` (`if (session.user.id !== review.authorId) throw`) |

## Qué se conserva

- El modelo de datos (8 tablas, mismos campos) — se traduce a schema Drizzle,
  no se rediseña.
- La arquitectura por capas + features (`schema.ts` / `queries.ts` /
  `actions.ts` / `components/`) — se mantiene igual, solo cambia la
  implementación interna de `queries.ts`.
- Zod, React Hook Form, next/image, Tailwind + shadcn/ui — sin cambios.

## Qué se reescribe

- `lib/supabase/*` → `lib/db/` (cliente Drizzle + conexión Neon) y
  `lib/auth/` (config de Auth.js).
- `middleware.ts` → adaptado a la sesión de Auth.js en vez de
  `@supabase/ssr`.
- Todas las `queries.ts` de `reviews`, `comments`, `reactions` → sintaxis
  Drizzle en vez de supabase-js.
- `features/auth/` → reemplazado por la config de Auth.js (Credentials
  provider con password hasheada, ej. con `bcrypt`).
- Subida de imágenes en `reviews` → `@vercel/blob` en vez de Supabase
  Storage.
- `supabase/migrations/*.sql` → migraciones Drizzle Kit (`drizzle-kit
  generate` / `drizzle-kit migrate`), sin RLS (la autorización se valida en
  código, no en policies SQL).
- `.env.example` → nuevas variables (`DATABASE_URL` de Neon,
  `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, etc.), se eliminan las de
  Supabase.

## Fases de la migración

### Fase A — Base: Neon + Drizzle + schema
- [ ] Crear proyecto en Neon, obtener `DATABASE_URL`.
- [ ] Instalar `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`.
- [ ] Definir el schema Drizzle (8 tablas, enums) en `src/lib/db/schema.ts`,
      traducido 1:1 desde `0001_initial.sql` (sin las secciones de RLS ni
      Storage).
- [ ] Generar y aplicar la migración inicial con Drizzle Kit.
- [ ] Seed de categorías.

### Fase B — Auth (reemplaza Fase 1 actual)
- [ ] Instalar `next-auth` (v5 / Auth.js) + `bcrypt`.
- [ ] Credentials provider: valida email+password hasheada contra una tabla
      `authors` (reemplaza `profiles` + `auth.users` de Supabase).
- [ ] Migrar `middleware.ts` a la sesión de Auth.js.
- [ ] Reescribir `features/auth/` (schema/actions/components) sobre
      Auth.js en vez de Supabase Auth.
- [ ] Migrar (o recrear) el usuario de la autora con su password hasheada.

### Fase C — CRUD de críticas sobre Drizzle (reemplaza Fase 2 actual)
- [ ] Reescribir `features/reviews/queries.ts` con Drizzle.
- [ ] Reescribir `features/reviews/actions.ts`: reemplazar la confianza en
      RLS por un chequeo explícito de sesión + ownership en cada acción.
- [ ] Revalidar el CRUD completo end-to-end (esta vez sin el bloqueante).

### Fase D — Imágenes sobre Vercel Blob
- [ ] Instalar `@vercel/blob`.
- [ ] Subida de hasta 2 imágenes desde el formulario de crítica.
- [ ] Adaptar `review_images` para guardar la URL de Blob en vez del
      `storage_path` de Supabase.

### Fase E — Resto de features sobre el nuevo stack
- [ ] `comments` y `reactions`: reescribir `queries.ts`/`actions.ts` con
      Drizzle, INSERT público sin necesidad de RLS (se valida en el server
      action).
- [ ] Vista pública (listado + detalle).
- [ ] Moderación de comentarios.

### Fase F — Deploy
- [ ] Variables de entorno en Vercel.
- [ ] Smoke test completo en producción.

## Nota sobre lo ya construido

El trabajo de diseño visual (paleta, tipografías, hero) y la estructura de
componentes UI (`review-form.tsx`, `review-list.tsx`, etc.) **se conservan
casi sin cambios** — son presentación pura, no dependen de Supabase.
Lo que se pierde/rehace es la capa de datos y auth de las Fases 1 y 2 ya
escritas.
