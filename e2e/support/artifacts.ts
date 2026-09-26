import { lstatSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

/**
 * Artefactos por corrida: cada ejecución de la suite escribe en
 * test-results/<RUN_ID> y playwright-report/<RUN_ID>, así una corrida
 * fallida no se pierde cuando arranca la siguiente.
 */

export const ARTIFACT_ROOTS = ["test-results", "playwright-report"] as const;
export const RUNS_TO_KEEP = 10; // incluye la corrida actual

// 2026-09-26T14-03-22 (hora local, sin ":" para que sea un nombre válido en cualquier sistema).
export const RUN_ID_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/;

export function formatRunId(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

/**
 * Qué carpetas de corridas anteriores borrar para que queden `keep` en total
 * contando la actual. Solo considera nombres con el formato exacto del id;
 * cualquier otro nombre se ignora (nunca se borra).
 */
export function selectRunsToDelete(names: string[], currentRunId: string, keep = RUNS_TO_KEEP): string[] {
  const previous = names
    .filter((name) => RUN_ID_PATTERN.test(name) && name !== currentRunId)
    .sort()
    .reverse(); // el formato ordena cronológicamente como texto

  return previous.slice(Math.max(keep - 1, 0));
}

/** Borra corridas viejas dentro de test-results/ y playwright-report/ (solo subcarpetas directas). */
export function cleanupOldRuns(projectRoot: string, currentRunId: string, keep = RUNS_TO_KEEP): string[] {
  const deleted: string[] = [];

  for (const root of ARTIFACT_ROOTS) {
    const rootPath = path.join(projectRoot, root);
    let entries: string[];

    try {
      entries = readdirSync(rootPath);
    } catch {
      continue; // la carpeta todavía no existe
    }

    const directories = entries.filter((name) => {
      try {
        // lstat: un symlink no cuenta como carpeta, así nunca se sigue fuera de la raíz.
        return lstatSync(path.join(rootPath, name)).isDirectory();
      } catch {
        return false;
      }
    });

    for (const name of selectRunsToDelete(directories, currentRunId, keep)) {
      rmSync(path.join(rootPath, name), { recursive: true, force: true });
      deleted.push(`${root}/${name}`);
    }
  }

  return deleted;
}
