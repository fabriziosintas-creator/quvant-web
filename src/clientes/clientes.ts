import { EVENTOS, MODULOS, type Modulo, type Plantilla } from "../../medicion-sistema/catalogo";

/**
 * Los clientes reales, puros (con pruebas en clientes.test.ts): qué módulos
 * se pueden activar en cada plantilla, si el permiso de métricas está
 * prendido según sus constancias, qué hace falta para prenderlo y los
 * motivos de baja.
 */

export const MOTIVOS_BAJA = ["precio", "no_lo_usaba", "cerro_el_negocio", "otro_sistema", "falta_funcion", "problemas_tecnicos", "otro"] as const;
export type MotivoBaja = (typeof MOTIVOS_BAJA)[number];
export const esMotivoBaja = (v: string): v is MotivoBaja => (MOTIVOS_BAJA as readonly string[]).includes(v);

export const MEDIOS_CONSTANCIA = ["contrato", "email", "mensaje", "otro"] as const;
export type MedioConstancia = (typeof MEDIOS_CONSTANCIA)[number];

/** Los módulos que no se eligen: van siempre. */
const SIEMPRE: readonly Modulo[] = ["sesion", "tablero", "configuracion"];

/** Los módulos que existen en una plantilla, en el orden del catálogo. */
export function modulosDe(plantilla: Plantilla): Modulo[] {
  const presentes = new Set<Modulo>();
  for (const e of Object.values(EVENTOS)) {
    const donde = e.plantillas as "todas" | readonly Plantilla[];
    if (donde === "todas" || donde.includes(plantilla)) presentes.add(e.modulo);
  }
  return MODULOS.filter((m) => presentes.has(m) && !SIEMPRE.includes(m));
}

export type Constancia = { accion: "prendido" | "apagado"; fecha: string; quien: string; medio: string; detalle: string | null; creadoEn: string };

/** La última constancia manda (la misma regla que aplica la base al prender). */
export function permisoVigente(historial: readonly Constancia[]): Constancia | null {
  return [...historial].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))[0] ?? null;
}

export type DatosConstancia = { fecha: string; quien: string; medio: string; detalle: string };

/** Qué falta para guardar una constancia (vacío: está completa). */
export function faltasDeConstancia(d: DatosConstancia, hoy: string): Array<"fecha" | "quien" | "medio" | "detalle"> {
  const faltas: Array<"fecha" | "quien" | "medio" | "detalle"> = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.fecha) || d.fecha > hoy) faltas.push("fecha");
  if (!d.quien.trim() || d.quien.length > 160) faltas.push("quien");
  if (!(MEDIOS_CONSTANCIA as readonly string[]).includes(d.medio)) faltas.push("medio");
  // "Otro" medio necesita decir cuál; y nunca más de 500 caracteres.
  if ((d.medio === "otro" && !d.detalle.trim()) || d.detalle.length > 500) faltas.push("detalle");
  return faltas;
}

/** Un identificador de organización: el mismo que viaja en los eventos del sistema. */
export function organizacionValida(v: string): boolean {
  return /^[A-Za-z0-9_.:-]{1,120}$/.test(v);
}
