import { diaBA, sumarDias } from "../objetivos/fechas";

/**
 * Los avisos del panel, puros (con pruebas en avisos.test.ts): cuándo un
 * cambio de estado de un objetivo merece aviso y cómo se agrupan por día.
 */

export const TIPOS_AVISO = ["registro", "visita_interesante", "chat", "objetivo_en_riesgo", "objetivo_cumplido", "alerta_roja", "oportunidad_estancada", "visita_repetida"] as const;
export type TipoAviso = (typeof TIPOS_AVISO)[number];
export type Prioridad = "alta" | "media" | "baja";
export const PRIORIDAD: Record<TipoAviso, Prioridad> = {
  registro: "alta",
  visita_interesante: "media",
  chat: "alta",
  objetivo_en_riesgo: "media",
  objetivo_cumplido: "baja",
  alerta_roja: "alta",
  oportunidad_estancada: "media",
  visita_repetida: "media",
};

/** Un objetivo que bajó de "en camino" (o "cumplido") a "en riesgo" o "atrasado", o que se cumplió. */
export function avisoDeObjetivo(anterior: string | null, actual: string): "objetivo_en_riesgo" | "objetivo_cumplido" | null {
  if (!anterior || anterior === actual) return null;
  if (actual === "cumplido") return "objetivo_cumplido";
  const bien = anterior === "en_camino" || anterior === "cumplido" || anterior === "sin_datos";
  if (bien && (actual === "en_riesgo" || actual === "atrasado")) return "objetivo_en_riesgo";
  return null;
}

export type GrupoAvisos<T> = { grupo: "hoy" | "ayer" | "antes"; avisos: T[] };

/** Hoy, ayer y antes, en hora de Buenos Aires (los grupos vacíos no van). */
export function agrupar<T extends { creadoEn: string }>(avisos: T[], ahora: string): Array<GrupoAvisos<T>> {
  const hoy = diaBA(ahora);
  const ayer = sumarDias(hoy, -1);
  const grupos: Array<GrupoAvisos<T>> = [
    { grupo: "hoy", avisos: [] },
    { grupo: "ayer", avisos: [] },
    { grupo: "antes", avisos: [] },
  ];
  for (const a of [...avisos].sort((x, y) => y.creadoEn.localeCompare(x.creadoEn))) {
    const dia = diaBA(a.creadoEn);
    grupos[dia === hoy ? 0 : dia === ayer ? 1 : 2].avisos.push(a);
  }
  return grupos.filter((g) => g.avisos.length > 0);
}
