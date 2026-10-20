/**
 * Agregados para las pantallas de Núcleos: de lo general (todo Quvant) a
 * lo particular (cada núcleo). Funciones puras sobre el panorama.
 */
import type { ClienteConIndicadores, Nucleo } from "@/servidor/nucleos/datos";
import type { PasoActivacion, Semaforo } from "./tipos";

export const promedio = (valores: number[]) => (valores.length === 0 ? null : Math.round(valores.reduce((a, b) => a + b, 0) / valores.length));

/** Las 12 semanas (lunes) alineadas, la más vieja primero. */
export function semanasDelPanorama(clientes: ClienteConIndicadores[]): string[] {
  const todas = new Set<string>();
  for (const c of clientes) for (const s of c.indicadores?.semanas ?? []) todas.add(s.inicio);
  return [...todas].sort().slice(-12);
}

/** Acciones por semana de un conjunto de clientes, alineadas a `semanas`. */
export function serieDe(clientes: ClienteConIndicadores[], semanas: string[]) {
  return semanas.map((inicio) => clientes.reduce((t, c) => t + (c.indicadores?.semanas.find((s) => s.inicio === inicio)?.acciones ?? 0), 0));
}

const ultimaSemana = (c: ClienteConIndicadores) => c.indicadores?.semanas[c.indicadores.semanas.length - 1];

export function tilesGenerales(clientes: ClienteConIndicadores[]) {
  const conSalud = clientes.map((c) => c.indicadores?.salud).filter((s): s is number => typeof s === "number");
  return {
    clientes: clientes.length,
    usuarios: clientes.reduce((t, c) => t + (ultimaSemana(c)?.usuariosActivos ?? 0), 0),
    acciones: clientes.reduce((t, c) => t + (ultimaSemana(c)?.acciones ?? 0), 0),
    salud: promedio(conSalud),
    alertas: clientes.reduce((t, c) => t + c.alertas.length, 0),
  };
}

export function resumenNucleo(nucleo: Nucleo, clientes: ClienteConIndicadores[]) {
  const propios = clientes.filter((c) => c.nucleoId === nucleo.id);
  const acciones = propios.reduce((t, c) => t + (ultimaSemana(c)?.acciones ?? 0), 0);
  const maximo = Math.max(1, ...clientes.map((c) => ultimaSemana(c)?.acciones ?? 0));
  return {
    nucleo,
    clientes: propios.length,
    acciones,
    /** 0 a 1, relativo al cliente más activo de todo Quvant (para el brillo de la constelación). */
    actividad: propios.length === 0 ? 0 : Math.min(1, acciones / (maximo * Math.max(1, propios.length)) * 2),
    salud: promedio(propios.map((c) => c.indicadores?.salud).filter((s): s is number => typeof s === "number")),
    adopcion: promedio(propios.map((c) => c.indicadores?.adopcion).filter((a): a is number => typeof a === "number").map((a) => a * 100)),
    alertas: propios.reduce((t, c) => t + c.alertas.length, 0),
    semaforos: contarSemaforos(propios),
  };
}

export function contarSemaforos(clientes: ClienteConIndicadores[]): Record<Semaforo, number> {
  const r: Record<Semaforo, number> = { verde: 0, amarillo: 0, rojo: 0, arranque: 0 };
  for (const c of clientes) r[c.indicadores?.semaforo ?? "arranque"]++;
  return r;
}

export function contarPasos(clientes: ClienteConIndicadores[]): Record<PasoActivacion, number> {
  const orden: PasoActivacion[] = ["alta", "primera_sesion", "primera_accion_principal", "primera_funcion_avanzada", "uso_semanal_estable"];
  const r = Object.fromEntries(orden.map((p) => [p, 0])) as Record<PasoActivacion, number>;
  for (const c of clientes) {
    const paso = c.paso ?? (c.indicadores ? "uso_semanal_estable" : "alta");
    // Llegar a un paso implica haber pasado por los anteriores.
    for (let i = 0; i <= orden.indexOf(paso); i++) r[orden[i]]++;
  }
  return r;
}

export type OrdenRanking = "salud" | "adopcion" | "tendencia" | "crecimiento";

export function ordenarClientes(clientes: ClienteConIndicadores[], orden: OrdenRanking) {
  const valor = (c: ClienteConIndicadores) => {
    const i = c.indicadores;
    if (!i) return -1;
    if (orden === "salud") return i.salud ?? -1;
    if (orden === "adopcion") return i.adopcion;
    if (orden === "tendencia") return i.tendencia.porcentaje;
    return i.crecimiento.total;
  };
  return [...clientes].sort((a, b) => valor(b) - valor(a) || a.nombre.localeCompare(b.nombre));
}

/** Las alertas de todos los clientes, las rojas primero y las más nuevas después. */
export function alertasOrdenadas(clientes: ClienteConIndicadores[]) {
  return clientes
    .flatMap((c) => c.alertas.map((a) => ({ ...a, cliente: c })))
    .sort((a, b) => (a.gravedad === b.gravedad ? b.fecha.localeCompare(a.fecha) : a.gravedad === "roja" ? -1 : 1));
}
