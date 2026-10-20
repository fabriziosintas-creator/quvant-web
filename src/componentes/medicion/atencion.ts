/**
 * Cómo se resume la atención de una visita en valores de lista cerrada
 * (nunca texto libre ni la dirección exacta de dónde vino). Puro: se
 * prueba en atencion.test.ts.
 */

export type Origen = "directo" | "buscador" | "red" | "campana" | "otro_sitio" | "interno";
export type Tramo = "menos_10" | "10_30" | "30_90" | "mas_90";
export type Profundidad = "25" | "50" | "75" | "100";

export const ORIGENES: readonly Origen[] = ["directo", "buscador", "red", "campana", "otro_sitio", "interno"];
export const TRAMOS: readonly Tramo[] = ["menos_10", "10_30", "30_90", "mas_90"];
export const PROFUNDIDADES: readonly Profundidad[] = ["25", "50", "75", "100"];

const BUSCADORES = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu|brave|startpage)\./i;
const REDES = /(^|\.)(instagram|facebook|fb|t|twitter|x|linkedin|lnkd|tiktok|youtube|youtu|whatsapp|wa|pinterest|threads|reddit)\.(com|me|co|in|be|net)$/i;

/** De dónde vino: campaña (utm_source) gana; después, por el sitio que lo trajo. Solo la categoría. */
export function origenDe(referente: string, url: string): Origen {
  let actual: URL;
  try {
    actual = new URL(url);
  } catch {
    return "directo";
  }
  if (actual.searchParams.has("utm_source") || actual.searchParams.has("gclid") || actual.searchParams.has("fbclid")) return "campana";
  if (!referente) return "directo";
  let host: string;
  try {
    host = new URL(referente).hostname.toLowerCase();
  } catch {
    return "directo";
  }
  if (host === actual.hostname.toLowerCase() || host.endsWith(".quvant.com.ar") || host === "quvant.com.ar") return "interno";
  if (BUSCADORES.test(host)) return "buscador";
  if (REDES.test(host) || host.startsWith("l.instagram.") || host.startsWith("lm.facebook.") || host === "t.co") return "red";
  return "otro_sitio";
}

export function tramoDe(ms: number): Tramo {
  if (ms < 10_000) return "menos_10";
  if (ms < 30_000) return "10_30";
  if (ms < 90_000) return "30_90";
  return "mas_90";
}

/** La profundidad máxima (0 a 1) en el tramo de abajo; null si no llegó ni a un cuarto. */
export function profundidadDe(fraccion: number): Profundidad | null {
  if (fraccion >= 0.98) return "100";
  if (fraccion >= 0.75) return "75";
  if (fraccion >= 0.5) return "50";
  if (fraccion >= 0.25) return "25";
  return null;
}

/** Qué parte de un bloque ya pasó por la pantalla (0 a 1), mirando dónde está su borde de abajo. */
export function fraccionVista(arriba: number, alto: number, altoPantalla: number) {
  if (alto <= 0) return 0;
  return Math.max(0, Math.min(1, (altoPantalla - arriba) / alto));
}
