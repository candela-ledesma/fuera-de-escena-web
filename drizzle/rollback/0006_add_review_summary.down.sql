-- Rollback manual de 0006_add_review_summary (drizzle-kit no genera "down").
--
-- Uso:
--   1. Correr este SQL contra la base a revertir (psql o la consola SQL de Neon).
--   2. En el repo, revertir el commit que agrega la columna (schema.ts,
--      drizzle/0006_add_review_summary.sql, drizzle/meta/0006_snapshot.json
--      y la entrada 0006 de drizzle/meta/_journal.json).
--
-- Atención: borra las bajadas cargadas. Si hay contenido que conservar,
-- exportar antes: SELECT id, slug, summary FROM reviews WHERE summary IS NOT NULL;

BEGIN;

ALTER TABLE "reviews" DROP COLUMN IF EXISTS "summary";

-- drizzle-kit registra cada migración aplicada con created_at = "when" del journal.
DELETE FROM "drizzle"."__drizzle_migrations" WHERE "created_at" = 1790198494872;

COMMIT;
