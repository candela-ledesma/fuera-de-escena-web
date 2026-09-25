# Fuera de Escena Web

Sitio web para publicar y consultar críticas teatrales y entrevistas de **Fuera de Escena** (Bahía Blanca). Incluye un sitio público con formato editorial y un panel privado para la autora.

## Características

- **Sitio público:**
  - home editorial con la última crítica destacada, las críticas recientes, las entrevistas y la franja "Sobre";
  - listados en `/critica` y `/entrevista`;
  - detalle de cada una en `/critica/[slug]` y `/entrevista/[slug]`.
- **Críticas y entrevistas** con estado borrador o publicada. Para publicar hacen falta:
  - la **bajada** (texto corto, hasta 200 caracteres), en las dos;
  - la **fecha de función**, solo en las críticas.
- **Imágenes:** hasta 2 por crítica o entrevista, con portada seleccionable.
- **Etiquetas y categorías.**
- **Comentarios públicos**, que la autora puede moderar.
- **Reacciones anónimas** ("Me gusta", "Me encanta", "Me sorprende", "Aplauso"): cada visitante puede tener una sola reacción por publicación.
- **Panel de autora** con login, autosave de borradores y CRUD completo. Se entra desde "Acceso autora", en el footer.

## Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4 + componentes UI reutilizables
- NextAuth (credenciales)
- Drizzle ORM + PostgreSQL (Neon)
- Vercel Blob para almacenamiento de imágenes
- Playwright para pruebas end-to-end

## Requisitos

- Node.js 20+
- npm 10+
- Acceso a los branches `dev` y `test` del proyecto de Neon

## Entornos de base de datos

Cada entorno usa su propio branch de Neon. Los ids de endpoint (`ep-…`) se ven en la consola de Neon y cambian si se recrea un branch.

| Entorno | Branch de Neon | Dónde se configura |
|---|---|---|
| Desarrollo local | `dev` | `.env.local` |
| Previews de Vercel | `dev` | Vercel → `DATABASE_URL` (Preview) |
| Tests E2E | `test` (hijo de `production`) | `.env.test` |
| Producción | `production` | Vercel → `DATABASE_URL` (Production) |

**Nunca** hay que apuntar `.env.local` ni `.env.test` a producción.

## Stores de Blob

Las imágenes van a Vercel Blob. El objetivo es que producción tenga su propio store y que el resto de los entornos usen uno no productivo:

| Entorno | Store | Credencial |
|---|---|---|
| Producción | store de producción | `BLOB_STORE_ID` (Vercel, OIDC), solo en Production |
| Previews de Vercel | store no productivo | `BLOB_STORE_ID` (Vercel, OIDC), solo en Preview y Development |
| Desarrollo local | store no productivo | `BLOB_READ_WRITE_TOKEN` en `.env.local` |
| Tests E2E | store no productivo | `BLOB_READ_WRITE_TOKEN` + `E2E_BLOB_STORE_ID` en `.env.test` |

> ⚠️ **Hasta completar los pasos de abajo, todos los entornos siguen usando el store de producción.** Local y los previews todavía pueden subir archivos a producción y **borrar archivos de producción**. El resguardo de la app evita borrar imágenes de *otro* store, pero mientras el store sea el mismo, no las distingue.

**Resguardo en la app.** Las bases `dev` y `test` son copias de producción, así que sus filas apuntan a imágenes del store de producción. `deleteOwnBlobs` (`src/lib/blob.ts`) solo borra las URLs del store con el que corre la app. Las demás se saltean con un aviso `[blob-guard]` en el log, que se puede buscar en los logs de Vercel. Si no puede determinar el store, no borra nada.

**Pasos para separar los stores**, a hacer después de desplegar el resguardo:

1. En Vercel → Storage, crear un store nuevo (por ejemplo `fuera-de-escena-nonprod`) y conectarlo al proyecto **solo en Preview y Development**.
2. En la conexión del store actual, dejar **solo Production**.
3. Copiar el read-write token del store nuevo a `BLOB_READ_WRITE_TOKEN` en `.env.local` y en `.env.test`.
4. En `.env.test`, poner en `E2E_BLOB_STORE_ID` el id del store nuevo (la parte del token entre `vercel_blob_rw_` y el siguiente `_`).
5. Correr `npm run test:e2e` y abrir un preview para verificar.

Las imágenes heredadas de producción se siguen viendo en `dev` y en los previews, porque son URLs públicas, pero desde ahí ya no se pueden borrar.

**Limpieza de archivos de E2E en producción.** Mientras la suite usó el store de producción, dejó archivos en `reviews/e2e-test-*` e `interviews/e2e-test-*`. Para listarlos o borrarlos, con el token del store de producción:

```bash
BLOB_READ_WRITE_TOKEN='<token>' npx tsx scripts/cleanup-e2e-blobs.ts         # dry-run: cantidad, tamaño y ejemplos
BLOB_READ_WRITE_TOKEN='<token>' npx tsx scripts/cleanup-e2e-blobs.ts --yes   # borra
```

Solo toca esos dos prefijos y no está conectado a ningún script automático.

## Configuración local

1. Instalar dependencias:

   ```bash
   npm ci
   ```

2. Crear `.env.local` en la raíz del repo:

   ```bash
   DATABASE_URL=postgresql://...   # branch `dev`
   AUTH_SECRET=...
   BLOB_READ_WRITE_TOKEN=...       # store no productivo
   ```

3. Para los E2E, crear además `.env.test` apuntando al branch `test`:

   ```bash
   DATABASE_URL=postgresql://...   # branch `test`
   AUTH_SECRET=...
   BLOB_READ_WRITE_TOKEN=...       # store no productivo
   TEST_AUTHOR_EMAIL=...
   TEST_AUTHOR_PASSWORD=...
   E2E_DB_HOST=ep-...              # id del endpoint del branch `test`
   E2E_BLOB_STORE_ID=...           # id del store del token de arriba
   ```

   La autora de prueba tiene que existir en `test` y tener `displayName` cargado, porque los tests verifican la firma.

4. Ejecutar migraciones y semillas (contra `dev`):

   ```bash
   npm run db:migrate
   npm run db:seed:categories
   npm run db:create-author -- autora@dominio.com passwordSegura "Nombre de autora"
   ```

5. Iniciar el entorno de desarrollo:

   ```bash
   npm run dev
   ```

## Tests E2E

```bash
npm run test:e2e
```

- Usa `.env.test` y levanta un build de producción en el puerto **3100**, para no reusar por error un `npm run dev` en el 3000.
- **Al arrancar borra todo el contenido de la base `test`** (`e2e/global-setup.ts`). Se conservan las categorías y las autoras. Después, cada test crea sus propios datos y los borra al terminar.
- Si el host de `DATABASE_URL` no coincide con `E2E_DB_HOST`, la suite aborta sin tocar nada. Si se recrea el branch `test`, hay que actualizar las dos variables.
- Mismo criterio para Blob: si el store del `BLOB_READ_WRITE_TOKEN` no es `E2E_BLOB_STORE_ID`, la suite aborta.
- Los estados globales de la home (0 críticas, 1 crítica, sin entrevistas) están en `e2e/home-states.spec.ts`. Corren en un project de Playwright aparte, después del resto de la suite.
- Los helpers compartidos (login, fixtures, borrado) están en `e2e/support/`.

## Migraciones

1. Cambiar `src/lib/db/schema.ts` y generar la migración con `npm run db:generate`. Revisar el SQL generado en `drizzle/`.
2. Si la migración no es trivial, agregar el rollback en `drizzle/rollback/` (drizzle-kit no genera "down").
3. Aplicarla en `dev` con `npm run db:migrate`.
4. Aplicarla en `test` con `node --env-file=.env.test ./node_modules/.bin/drizzle-kit migrate`.
5. Correr la suite E2E.

### Migraciones en producción

> ⚠️ **La migración se aplica en producción ANTES de mergear a `main`.** Vercel despliega `main` automáticamente. Si el código nuevo llega antes que la columna, las páginas que la usan fallan.

Las migraciones tienen que ser compatibles con el código que ya está en producción (por ejemplo, columnas nuevas nullable), para que aplicarlas antes del merge no rompa nada.

La URL de producción no se puede bajar con `vercel env pull`: es una variable sensible y vuelve vacía. Se toma de la consola de Neon (branch `production`). Hay dos formas de aplicar la migración:

**A. Desde la terminal**, sin guardar la URL en ningún archivo:

```bash
DATABASE_URL='<URL del branch production>' npx drizzle-kit migrate
```

**B. Desde la consola SQL de Neon.** Hay que pegar el SQL de la migración **y** registrarla en la misma transacción. Si no se registra, el próximo `drizzle-kit migrate` intenta aplicarla de nuevo y falla.

```sql
BEGIN;

-- contenido de drizzle/NNNN_nombre.sql

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
VALUES ('<hash>', <when>);

COMMIT;
```

- `<hash>`: salida de `shasum -a 256 drizzle/NNNN_nombre.sql`.
- `<when>`: el campo `when` de esa migración en `drizzle/meta/_journal.json`.

**Orden de un PR con migración:**
1. Mergear la branch en su rama de integración (no en `main`) y validar en `dev` y `test`.
2. Aplicar la migración en `production`.
3. Mergear a `main`.
4. Verificar el sitio en producción.

Si algo falla después del deploy, lo más rápido es el "Instant Rollback" de Vercel, que devuelve el código anterior sin tocar la base.

## Scripts disponibles

- `npm run dev`: servidor de desarrollo.
- `npm run build`: build de producción.
- `npm run start`: correr el build de producción.
- `npm run lint`: lint con ESLint.
- `npm run test:unit`: tests unitarios (`src/**/*.test.ts`) con el runner de Node.
- `npm run test:e2e`: suite E2E con Playwright (ver "Tests E2E").
- `npm run db:generate`: generar migraciones con Drizzle.
- `npm run db:migrate`: aplicar migraciones contra `.env.local` (`dev`).
- `npm run db:studio`: abrir Drizzle Studio contra `.env.local`.
- `npm run db:seed:categories`: poblar las categorías iniciales.
- `npm run db:create-author -- <email> <password> [displayName]`: crear una autora.
- `npm run db:reset-password -- <email> <newPassword>`: cambiar la contraseña de una autora.

Scripts de mantenimiento puntual, que se usaron en migraciones de datos anteriores:

- `npm run db:backfill-cover-images`: marca como portada la primera imagen de las publicaciones que no tienen portada.
- `npm run db:backfill-content-json`: genera el contenido del editor (`content_json`) a partir del texto plano en las publicaciones antiguas.
- `npm run db:deduplicate-reactions`: deja una sola reacción por visitante y publicación.

## Estructura principal

- `src/app`: rutas. `(public)` tiene la home, los listados y los detalles, con layout propio. `(author)` tiene el login y el panel.
- `src/components/site`: header, footer, franjas y contenedor del sitio público.
- `src/components/ui`: componentes UI base.
- `src/features`: lógica por dominio (`reviews`, `interviews`, `comments`, `reactions`, `auth`). Cada dominio tiene sus actions, queries, schemas y componentes.
- `src/lib`: auth, base de datos, utilidades y `site-config.ts` (textos y links del sitio).
- `drizzle`: migraciones SQL generadas. En `drizzle/rollback` están los rollbacks manuales.
- `e2e`: pruebas end-to-end con Playwright. En `e2e/support` están los helpers compartidos.
- `scripts`: scripts manuales que no se corren solos (por ejemplo, la limpieza de archivos de E2E en Blob).
