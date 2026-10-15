import { TIEMPO } from "../brand/tokens";

/**
 * Los tiempos del salto, sin dependencias (los usan las composiciones y los
 * scripts de mezcla).
 */

/** Cuántos cuadros vuela el punto (420 ms) y cuántos dura el revelado. */
export function cuadrosDelSalto(fps: number) {
  const vuelo = Math.round((TIEMPO.saltoMs / 1000) * fps);
  const revelado = Math.round(0.53 * fps);
  return { vuelo, revelado, total: vuelo + revelado, corte: vuelo / (vuelo + revelado) };
}

/** Los segundos en los que el salto termina de revelar cada escena del spot (de Código al Cierre). */
export const REVELADAS_SPOT = [3, 8, 14, 24, 33, 36, 40];

/** Cuándo aterriza el punto en cada salto del spot: ahí va el "tic". */
export function aterrizajesSpot(fps: number) {
  const s = cuadrosDelSalto(fps);
  return REVELADAS_SPOT.map((r) => r - s.revelado / fps);
}
