import type { Unidad } from "./tipos";

/** Cómo se escribe un valor según su unidad, en castellano de Argentina. */

const ENTERO = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const DECIMAL = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
const PESOS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export function conUnidad(valor: number | null, unidad: Unidad): string {
  if (valor === null || !Number.isFinite(valor)) return "—";
  switch (unidad) {
    case "ars":
      return PESOS.format(valor);
    case "usd":
      return `USD ${ENTERO.format(valor)}`;
    case "porcentaje":
      return `${DECIMAL.format(valor)} %`;
    case "horas":
      return `${DECIMAL.format(valor)} h`;
    default:
      return Number.isInteger(valor) ? ENTERO.format(valor) : DECIMAL.format(valor);
  }
}

/** Lo mismo, corto, para los ejes de los gráficos ($1,5 M, 12 k). */
export function corto(valor: number, unidad: Unidad): string {
  const abs = Math.abs(valor);
  const n = abs >= 1e6 ? `${DECIMAL.format(valor / 1e6)} M` : abs >= 1e4 ? `${ENTERO.format(valor / 1e3)} k` : DECIMAL.format(valor);
  if (unidad === "ars") return `$${n}`;
  if (unidad === "usd") return `USD ${n}`;
  if (unidad === "porcentaje") return `${n} %`;
  return n;
}

export const porcentajeEntero = (fraccion: number) => `${ENTERO.format(Math.round(fraccion * 100))} %`;

/** "2026-11-05" → "05/11". */
export const diaCorto = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
/** "2026-11-05" → "05/11/26". */
export const diaLargo = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}/${dia.slice(2, 4)}`;
