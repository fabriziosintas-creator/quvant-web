import { useEffect, useState, type CSSProperties } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { cargarFuentes } from "../brand/fuentes";
import { COLOR, TRACKING } from "../brand/tokens";

/**
 * Lo que comparten las escenas del spot 2026: las letras (las del sitio
 * desde octubre de 2026: títulos en IBM Plex Sans semibold, etiquetas en
 * Plex Mono, la marca en Michroma), los colores de cada bloque y unas
 * curvas.
 */

export { curvaMarca, mezcla, recorte, suave, tramo } from "../scenes/comun";

/** Un acento por bloque, los mismos de los canales del sitio. */
export const ACENTO = {
  trabajos: "#6C8CFF",
  metodo: "#F26B5B",
  contacto: "#7BD389",
} as const;

export { COLOR };

const SANS = [
  { familia: "IBM Plex Sans", archivo: "fonts/IBMPlexSans-SemiBold.woff2", peso: "600" },
  { familia: "IBM Plex Sans", archivo: "fonts/IBMPlexSans-Regular.woff2", peso: "400" },
];

let promesaSans: Promise<void> | null = null;
function cargarSans() {
  if (!promesaSans) {
    const caras = SANS.map((f) => new FontFace(f.familia, `url(${staticFile(f.archivo)})`, { weight: f.peso }));
    promesaSans = Promise.all(caras.map((c) => c.load())).then((cargadas) => cargadas.forEach((c) => document.fonts.add(c)));
  }
  return promesaSans;
}

/** Retiene el render hasta que estén todas las letras. */
export function useLetras() {
  const [espera] = useState(() => delayRender("letras del spot 2026"));
  useEffect(() => {
    Promise.all([cargarFuentes(), cargarSans()])
      .then(() => continueRender(espera))
      .catch((error) => cancelRender(error));
  }, [espera]);
}

/** Títulos: Plex Sans semibold, con las letras un poco más juntas (como el sitio). */
export const titulo = (px: number): CSSProperties => ({
  fontFamily: '"IBM Plex Sans", sans-serif',
  fontWeight: 600,
  fontSize: px,
  lineHeight: 1.04,
  letterSpacing: "-0.022em",
  color: COLOR.blanco,
});

export const texto = (px: number): CSSProperties => ({
  fontFamily: '"IBM Plex Sans", sans-serif',
  fontWeight: 400,
  fontSize: px,
  lineHeight: 1.35,
  color: COLOR.acero,
});

/** Etiquetas: Plex Mono en mayúsculas con tracking +200. */
export const etiqueta = (px: number): CSSProperties => ({
  fontFamily: '"IBM Plex Mono", monospace',
  fontWeight: 400,
  fontSize: px,
  letterSpacing: TRACKING.etiqueta,
  textTransform: "uppercase",
  color: COLOR.acero,
});

export const michroma = (px: number): CSSProperties => ({
  fontFamily: "Michroma, sans-serif",
  fontSize: px,
  lineHeight: 1,
  letterSpacing: TRACKING.logotipo,
  color: COLOR.blanco,
});

/** Generador determinístico: el mismo cuadro da siempre el mismo "azar". */
export function azar(semilla: number) {
  let a = (semilla * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Las capturas del sitio, en public/spot2026/ (npm run preparar-spot-2026). */
export const archivo = (nombre: string) => staticFile(`spot2026/${nombre}`);
