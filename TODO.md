# TODO

## Prioridad 1: entorno y base

- [ ] Crear `.env.local` con `DATABASE_URL`, `AUTH_SECRET` y `BLOB_READ_WRITE_TOKEN` apuntando al branch `dev`.
- [ ] Crear `.env.test` con `DATABASE_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, `TEST_AUTHOR_EMAIL`, `TEST_AUTHOR_PASSWORD`, `E2E_DB_HOST` y `E2E_BLOB_STORE_ID` apuntando al branch `test`.
- [ ] Confirmar que la autora de prueba existe en `test` y tiene `displayName` cargado.
- [ ] Ejecutar migraciones en `dev`:
  - `npm run db:migrate`
  - `npm run db:seed:categories`
  - `npm run db:create-author -- <email> <password> "<displayName>"`

## Prioridad 2: validación local

- [ ] Arrancar el proyecto localmente con `npm run dev`.
- [ ] Probar login del panel de autora.
- [ ] Probar crear, editar y publicar una crítica.
- [ ] Probar crear, editar y publicar una entrevista.
- [ ] Verificar carga de imágenes y portada seleccionable.
- [ ] Revisar comentarios y reacciones en el sitio público.

## Prioridad 3: stores de Blob

- [ ] Crear un store no productivo en Vercel para Preview/Development.
- [ ] Dejar el store actual solo en Production.
- [ ] Poner el token del store nuevo en `.env.local` y `.env.test`.
- [ ] Poner `E2E_BLOB_STORE_ID` con el id del store nuevo.
- [ ] Validar que local y previews no sigan usando el store de producción.

## Prioridad 4: pruebas E2E

- [ ] Ejecutar `npm run test:e2e`.
- [ ] Revisar los fallos reales de Playwright.
- [ ] Corregir los errores de flujo o validación detectados.
- [ ] Confirmar que la suite limpia datos y no deja artefactos en la base de prueba.

## Prioridad 5: deploy y producción

- [ ] Revisar si hay migraciones pendientes antes del merge.
- [ ] Aplicar migraciones en `production` antes del merge a `main`.
- [ ] Hacer merge a `main` solo después de validar en `dev` y `test`.
- [ ] Verificar el sitio en producción y deplegar con rollback si hace falta.

## Observaciones

- La app ya quedó en una etapa funcional y estructuralmente avanzada.
- La mayor parte del trabajo pendiente es operativo: entorno, validación, Blob y despliegue.
- La documentación base del proyecto está en [README.md](README.md).
