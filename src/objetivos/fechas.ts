import type { Dia } from "./tipos";

/**
 * Días de Buenos Aires como "AAAA-MM-DD". La Argentina no tiene horario de
 * verano: UTC−3 todo el año. Las cuentas se hacen en UTC con fechas
 * "puras" (mediodía), para que nunca se corra un día.
 */

const MS_DIA = 86_400_000;

/** Un instante (ISO o Date) → el día en Buenos Aires. */
export function diaBA(instante: string | Date): Dia {
  const t = typeof instante === "string" ? Date.parse(instante) : instante.getTime();
  return new Date(t - 3 * 3_600_000).toISOString().slice(0, 10);
}

const aMs = (dia: Dia) => Date.parse(`${dia}T12:00:00Z`);
const deMs = (ms: number): Dia => new Date(ms).toISOString().slice(0, 10);

export const sumarDias = (dia: Dia, n: number): Dia => deMs(aMs(dia) + n * MS_DIA);
/** Días entre dos fechas (b − a). */
export const diasEntre = (a: Dia, b: Dia) => Math.round((aMs(b) - aMs(a)) / MS_DIA);
export const mesDe = (dia: Dia) => dia.slice(0, 7);
export const minDia = (a: Dia, b: Dia) => (a < b ? a : b);
export const maxDia = (a: Dia, b: Dia) => (a > b ? a : b);
export const enRango = (dia: Dia, desde: Dia, hasta: Dia) => dia >= desde && dia <= hasta;

/** Lunes a viernes (los feriados no se descuentan: es una aproximación y lo dice la pantalla). */
export const esHabil = (dia: Dia) => {
  const d = new Date(aMs(dia)).getUTCDay();
  return d !== 0 && d !== 6;
};

/** Días (hábiles o corridos) desde `desde` hasta `hasta`, ambos incluidos. */
export function contarDias(desde: Dia, hasta: Dia, habiles: boolean) {
  if (hasta < desde) return 0;
  if (!habiles) return diasEntre(desde, hasta) + 1;
  let n = 0;
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) if (esHabil(d)) n++;
  return n;
}

/** Cada día del rango, ambos incluidos. */
export function cadaDia(desde: Dia, hasta: Dia): Dia[] {
  const dias: Dia[] = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) dias.push(d);
  return dias;
}

/** Primer y último día del mes de una fecha. */
export function limitesDelMes(dia: Dia): { desde: Dia; hasta: Dia } {
  const desde = `${dia.slice(0, 7)}-01`;
  const [a, m] = dia.slice(0, 7).split("-").map(Number);
  const siguiente = m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, "0")}-01`;
  return { desde, hasta: sumarDias(siguiente, -1) };
}

/** Meses (fracción) que cubre un rango: para promediar por mes. */
export const mesesDe = (desde: Dia, hasta: Dia) => Math.max(1, (diasEntre(desde, hasta) + 1) / 30.4375);
