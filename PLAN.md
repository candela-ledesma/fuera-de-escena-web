# Plan de fases — Fuera de Escena BB

Decisiones de producto confirmadas:
- **Categorías**: seed genérico (Teatro, Comedia, Drama, Musical, Infantil, Danza/Performance), editable después.
- **Reacciones**: se mantiene el enum actual `like | love | wow | applause`.
- **Comentarios**: solo `author_name` + `body`, sin email ni antispam extra por ahora.

Estado de partida: scaffold Next.js 15 + Tailwind + shadcn/ui, clientes Supabase,
estructura de features (vacía), migración SQL con RLS ya escrita (no aplicada aún
a un proyecto Supabase real).

---

## Fase 0 — Poner Supabase en marcha
- [ ] Crear proyecto en Supabase (o confirmar que ya existe uno).
- [ ] Cargar `.env.local` con las variables de `.env.example`.
- [ ] Aplicar `supabase/migrations/0001_initial.sql`.
- [ ] Seed de `categories` (Teatro, Comedia, Drama, Musical, Infantil, Danza/Performance).
- [ ] Crear el usuario de la autora en Supabase Auth + su fila en `profiles`.
- [ ] Instalar componentes shadcn/ui base que vamos a necesitar (button, input, textarea, form, card, dialog, badge, etc.).

## Fase 1 — Auth de la autora
- [ ] Página de login privada en `(author)` (email + contraseña vía Supabase Auth).
- [ ] Middleware/guard para proteger todo `(author)/*`: sin sesión → redirect a login.
- [ ] Logout.
- [ ] `lib/supabase/server.ts` ya soporta cookies; validar el flujo completo con sesión real.

## Fase 2 — CRUD de críticas (sin imágenes todavía)
- [ ] `features/reviews/schema.ts`: tipos + validación Zod (título, teatro, fecha, categoría, rating 1–5, body, tags, slug).
- [ ] `features/reviews/queries.ts`: acceso a datos (crear, leer, listar, actualizar, borrar, publicar/despublicar).
- [ ] `features/reviews/actions.ts`: Server Actions que validan con Zod, chequean auth, orquestan queries.
- [ ] `features/reviews/components/`: formulario (React Hook Form) para crear/editar, sin lógica de negocio.
- [ ] Panel `(author)`: listado de críticas propias (draft/published) + crear + editar + borrar.
- [ ] Manejo de tags: crear tags nuevas al vuelo o elegir existentes (N:M vía `review_tags`).

## Fase 3 — Imágenes
- [ ] Subida de hasta 2 imágenes a Supabase Storage (`review-images`) desde el formulario de crítica.
- [ ] `review_images`: guardar `storage_path`, `alt_text` (obligatorio para accesibilidad), `position`.
- [ ] Reemplazo/borrado de imágenes al editar.
- [ ] Render con `next/image` en detalle y listado.

## Fase 4 — Vista pública
- [ ] Home: listado de críticas publicadas (`status = 'published'`), paginado u ordenado por `published_at desc`.
- [ ] Filtro por categoría y/o tag.
- [ ] Página de detalle de crítica (slug): texto completo, imágenes, rating, tags, teatro, fecha.
- [ ] SEO básico: metadata por página, OpenGraph con imagen de la crítica.
- [ ] Accesibilidad: labels, alt text real, foco visible, contraste (heredado del diseño ya iniciado).

## Fase 5 — Comentarios
- [ ] `features/comments/schema.ts`: Zod para `author_name` + `body` (largo mínimo/máximo, sanitización básica).
- [ ] `features/comments/actions.ts`: insertar comentario público → queda `pending` automáticamente.
- [ ] `features/comments/components/`: formulario de comentario (sin login) + listado de comentarios `approved` en el detalle de la crítica.

## Fase 6 — Reacciones
- [ ] `anon_id`: generar/persistir en cookie o localStorage en el cliente.
- [ ] `features/reactions/schema.ts` + `actions.ts`: insertar reacción (like/love/wow/applause), respetando el `unique(review_id, type, anon_id)`.
- [ ] `features/reactions/components/`: botones de reacción con conteo, deshabilitando la ya elegida por ese `anon_id`.

## Fase 7 — Moderación
- [ ] Panel `(author)`: listado de comentarios `pending` por crítica o global.
- [ ] Acciones de aprobar/rechazar (Server Actions, solo autora vía RLS + chequeo de sesión).
- [ ] (Opcional) notificación simple de "hay comentarios pendientes" en el panel.

## Fase 8 — Deploy
- [ ] Variables de entorno en Vercel/Netlify.
- [ ] Verificar RLS en producción (probar como usuario anónimo y como autora).
- [ ] Chequeo final de accesibilidad y metadata SEO.
- [ ] Deploy y smoke test manual del flujo completo: publicar crítica → verla pública → comentar → reaccionar → moderar.

---

Cada fase se entrega y se espera tu OK antes de pasar a la siguiente, salvo que digas
lo contrario. Dentro de cada fase, la separación por capas (`schema.ts` / `queries.ts`
/ `actions.ts` / `components/`) se respeta sin excepciones.
