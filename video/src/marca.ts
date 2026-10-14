/**
 * La identidad de Quvant en números, para que las escenas no inventen
 * colores ni medidas. Sale del manual (sección 06) y de la web.
 */

export const COLORES = {
  negro: "#0D0D0F",
  blanco: "#ECECEE",
  acero: "#9C9CA3",
  profundo: "#26262B",
} as const;

/**
 * La Q del manual, en un lienzo de 105 con el eje Y hacia abajo:
 * aro de centro (44,44) y radio 31 con trazo 10, cola a 45° de (63,63)
 * a (80,80), y punto cuadrado en (86,86) de lado 11.
 */
export const Q = {
  lienzo: 105,
  aro: { centro: [44, 44] as const, radio: 31, trazo: 10 },
  cola: { desde: [63, 63] as const, hasta: [80, 80] as const },
  punto: { esquina: [86, 86] as const, lado: 11 },
} as const;

/** El cromo de la Q: casi espejo, apenas rugoso. */
export const CROMO = { metalness: 1, roughness: 0.06 } as const;

/** Aluminio anodizado negro de los dispositivos. */
export const ALUMINIO = { color: "#141418", metalness: 0.8, roughness: 0.35 } as const;
