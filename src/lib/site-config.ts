/** Textos y links del sitio público. Única fuente: header, franjas y footer leen de acá. */
export const SITE = {
  name: "Fuera de Escena",
  fullName: "Fuera de Escena BB",
  tagline: "mirar teatro desde otro lugar",
  about: "Críticas, miradas y recomendaciones sobre teatro en Bahía Blanca y la región.",
  location: "Bahía Blanca · Argentina",
  instagramHandle: "@fueradeescenabb",
  instagramUrl: "https://www.instagram.com/fueradeescenabb",
} as const;

export type NavItem = {
  label: string;
  href: string;
  /** El ítem queda activo en esta ruta y en sus hijas (listado + detalle). */
  activePrefix?: string;
  external?: boolean;
};

export const MAIN_NAV: NavItem[] = [
  { label: "Críticas", href: "/critica", activePrefix: "/critica" },
  { label: "Entrevistas", href: "/entrevista", activePrefix: "/entrevista" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Instagram", href: SITE.instagramUrl, external: true },
];

export const FOOTER_NAV: NavItem[] = [
  { label: "Críticas", href: "/critica" },
  { label: "Entrevistas", href: "/entrevista" },
  { label: "Acceso autora", href: "/login" },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (!item.activePrefix) return false;

  return pathname === item.activePrefix || pathname.startsWith(`${item.activePrefix}/`);
}
