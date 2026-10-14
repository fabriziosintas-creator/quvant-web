/**
 * Los acentos de color del sitio.
 *
 * Decisión de fabrizio (14-oct-2026): la página deja de ser solo blanco y
 * negro. El color entra con sistema: un acento por nicho (que también
 * pinta su rama y su plantilla en la escena 3D) y un acento por sección.
 * Los textos siguen en blanco y acero; el color va en puntos, bordes,
 * luces, fotos y brillos, nunca en párrafos.
 *
 * Todos están pensados sobre el negro #0D0D0F: saturados pero no neón.
 */

export const ACENTO_NICHO = {
  industria: "#F0A33A",
  gimnasios: "#7BD389",
  supermercados: "#F26B5B",
  kioscos: "#F2D35B",
  farmacias: "#4FD1C5",
  abogacia: "#6C8CFF",
  inmobiliarias: "#E08A5B",
  pymes: "#B388FF",
  holistica: "#F28CB6",
} as const;

export type IdNicho = keyof typeof ACENTO_NICHO;

/** Un acento por sección: tiñe el punto, el número y los bordes al pasar. */
export const ACENTO_SECCION = {
  objetivo: "#F26B5B",
  nosotros: "#F0A33A",
  plataformas: "#4FD1C5",
  webs: "#6C8CFF",
  contacto: "#7BD389",
} as const;

/** Los tres colores del brillo de fondo (portada y cierre). */
export const AURORA = ["#4FD1C5", "#6C8CFF", "#F0A33A"] as const;

/** Convierte "#rrggbb" a "r g b" para usar con opacidad en CSS: rgb(var(--x) / 0.3). */
export function aRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}
