# Fuera de Escena Web

Sitio web para publicar y consultar críticas teatrales de **Fuera de Escena**. Incluye un panel privado para la autora y una vista pública para lectores.

## Características

- Publicación de críticas con estado borrador/publicada.
- Subida de hasta 2 imágenes por crítica (con portada seleccionable).
- Sistema de etiquetas y categorías.
- Comentarios públicos en cada crítica.
- Reacciones anónimas (like, love, wow, applause).
- Panel de autora con login y CRUD completo.

## Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS + componentes UI reutilizables
- NextAuth (credenciales)
- Drizzle ORM + PostgreSQL (Neon)
- Vercel Blob para almacenamiento de imágenes
- Playwright para pruebas end-to-end

## Requisitos

- Node.js 20+
- npm 10+
- Base de datos PostgreSQL accesible por `DATABASE_URL`

## Configuración local

1. Instalar dependencias:

   ```bash
   npm ci
   ```

2. Crear `/home/runner/work/fuera-de-escena-web/fuera-de-escena-web/.env.local` con variables mínimas:

   ```bash
   DATABASE_URL=postgresql://...
   AUTH_SECRET=...
   BLOB_READ_WRITE_TOKEN=...

   # Solo para e2e
   TEST_AUTHOR_EMAIL=...
   TEST_AUTHOR_PASSWORD=...
   ```

3. Ejecutar migraciones y semillas:

   ```bash
   npm run db:migrate
   npm run db:seed:categories
   npm run db:create-author -- autora@dominio.com passwordSegura "Nombre de autora"
   ```

4. Iniciar el entorno de desarrollo:

   ```bash
   npm run dev
   ```

## Scripts disponibles

- `npm run dev`: servidor de desarrollo.
- `npm run build`: build de producción.
- `npm run start`: correr build en producción.
- `npm run lint`: lint con ESLint.
- `npm run test:e2e`: suite E2E con Playwright.
- `npm run db:generate`: generar migraciones con Drizzle.
- `npm run db:migrate`: aplicar migraciones.
- `npm run db:studio`: abrir Drizzle Studio.
- `npm run db:seed:categories`: poblar categorías iniciales.
- `npm run db:create-author -- <email> <password> [displayName]`: crear autora.

## Estructura principal

- `/home/runner/work/fuera-de-escena-web/fuera-de-escena-web/src/app`: rutas públicas, login y panel de autora.
- `/home/runner/work/fuera-de-escena-web/fuera-de-escena-web/src/features`: lógica por dominio (`reviews`, `comments`, `reactions`, `auth`).
- `/home/runner/work/fuera-de-escena-web/fuera-de-escena-web/src/lib`: auth, base de datos y utilidades.
- `/home/runner/work/fuera-de-escena-web/fuera-de-escena-web/e2e`: pruebas end-to-end con Playwright.
- `/home/runner/work/fuera-de-escena-web/fuera-de-escena-web/drizzle`: migraciones SQL.
