/**
 * La única fuente de verdad de la marca para el video. Ningún componente,
 * escena, script ni shader escribe un hex o un nombre de fuente por su
 * cuenta: todo sale de acá.
 */

export const COLOR = {
  /** Fondo principal: el negro base de TODO el video. */
  negro: "#0D0D0F",
  /** Logo, títulos, textos sobre negro. */
  blanco: "#ECECEE",
  /** Textos secundarios y bajadas. */
  acero: "#9C9CA3",
  /** Fondos de apoyo, grilla de puntos, recursos sutiles. */
  profundo: "#26262B",
  /** Solo para el cromado de la Q: la única excepción metálica. */
  plata: "#B9BBBF",
} as const;

/** El mismo color como vec3 0..1, listo para un uniform de shader. */
export function colorVec3(nombre: keyof typeof COLOR): [number, number, number] {
  const n = parseInt(COLOR[nombre].slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const FUENTE = {
  /** Solo QUVANT, YUNQUE, FORJA y BY QUVANT. Siempre mayúsculas. */
  michroma: { familia: "Michroma", archivo: "fonts/Michroma-Regular.ttf" },
  /** Todo lo demás. Etiquetas en mayúsculas con tracking +200. */
  plex: { familia: "IBM Plex Mono", archivo: "fonts/IBMPlexMono-Regular.ttf" },
} as const;

/** Tracking del manual, en em (+160 a +200). */
export const TRACKING = { logotipo: "0.18em", etiqueta: "0.2em" } as const;

export const TIEMPO = {
  fps: 60,
  ancho: 3840,
  alto: 2160,
  /** El salto del punto: 420 ms con cubic-bezier(.2,.8,.2,1). */
  saltoMs: 420,
  saltoEasing: [0.2, 0.8, 0.2, 1] as const,
  heroLoopSegundos: 24,
  spotSegundos: 45,
} as const;

/** La Q del manual, en un lienzo de 105 con el eje Y hacia abajo. */
export const Q = {
  lienzo: 105,
  aro: { centro: [44, 44] as const, radio: 31, trazo: 10 },
  cola: { desde: [63, 63] as const, hasta: [80, 80] as const },
  punto: { esquina: [86, 86] as const, lado: 11 },
} as const;

/** Textos en pantalla, exactos. */
export const TEXTO = {
  logotipo: "QUVANT",
  bajada: "Software a la vanguardia de cada nicho.",
  yunque: "YUNQUE",
  forja: "FORJA",
  firmaYunque: "Yunque · BY QUVANT",
  firmaForja: "Forja · BY QUVANT",
  yunqueBajada: "Tu stock al día en todas las sucursales.",
  forjaBajada: "Cada sucursal por dentro, en vivo.",
  industria: "Entramos en un rubro. Entendemos cómo trabaja.",
  metodo1: "Lo construimos por fases.",
  metodo2: "Cada fase se prueba antes de seguir.",
  etiquetaProgramacion: "01 · PROGRAMACIÓN",
  etiquetaDiseno: "02 · DISEÑO",
} as const;
