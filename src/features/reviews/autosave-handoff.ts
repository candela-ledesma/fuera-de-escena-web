/**
 * Tras el primer autosave de un borrador nuevo, el formulario navega a la
 * página de edición (que monta otro formulario, con la action de actualizar).
 * Esta marca en sessionStorage le pasa el estado "guardado" al formulario
 * nuevo, para que el aviso no desaparezca con la navegación.
 */

const KEY = "fde:autosave-just-saved";

export function markJustAutosaved(id: string): void {
  try {
    window.sessionStorage.setItem(KEY, id);
  } catch {
    // Sin la marca solo se pierde el aviso.
  }
}

/** true si el borrador `id` se acaba de guardar antes de navegar (y consume la marca). */
export function consumeJustAutosaved(id: string | undefined): boolean {
  if (!id) return false;

  try {
    if (window.sessionStorage.getItem(KEY) !== id) return false;
    window.sessionStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
