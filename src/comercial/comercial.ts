import { wilson, type Proporcion } from "../nichos/estadistica";

/**
 * El seguimiento comercial, puro (sin base ni red), con pruebas en
 * comercial.test.ts: las etapas, su probabilidad, los días en la etapa, el
 * valor ponderado, el embudo entre etapas y las horas hábiles hasta el
 * primer contacto.
 */

export const ETAPAS = ["nuevo", "contactado", "demo_agendada", "demo_hecha", "propuesta", "negociacion", "ganado", "perdido"] as const;
export type Etapa = (typeof ETAPAS)[number];
/** Las del tablero, en orden (perdido va aparte). */
export const ETAPAS_ABIERTAS: Etapa[] = ["nuevo", "contactado", "demo_agendada", "demo_hecha", "propuesta", "negociacion"];
export const esEtapa = (v: string): v is Etapa => (ETAPAS as readonly string[]).includes(v);

export const TIPOS_ACTIVIDAD = ["cambio_etapa", "llamada", "mensaje", "reunion", "demo", "propuesta", "nota"] as const;
export type TipoActividad = (typeof TIPOS_ACTIVIDAD)[number];
/** Las actividades que cuentan como "contacto" (para el tiempo al primer contacto). */
export const CONTACTOS: TipoActividad[] = ["llamada", "mensaje", "reunion", "demo"];

export const MOTIVOS_PERDIDA = ["precio", "ya_tiene_sistema", "no_es_el_momento", "no_responde", "otro"] as const;
export type MotivoPerdida = (typeof MOTIVOS_PERDIDA)[number];

/** Probabilidad de cierre por etapa (0 a 100), si la oportunidad no tiene una propia. */
export const PROBABILIDAD: Record<Etapa, number> = { nuevo: 5, contactado: 10, demo_agendada: 20, demo_hecha: 35, propuesta: 50, negociacion: 70, ganado: 100, perdido: 0 };

/** Días hábiles que una oportunidad puede estar en una etapa antes de marcarse "estancada". */
export const UMBRAL_DIAS: Record<Etapa, number> = { nuevo: 1, contactado: 7, demo_agendada: 7, demo_hecha: 7, propuesta: 10, negociacion: 15, ganado: Infinity, perdido: Infinity };

export type Oportunidad = {
  id: string;
  etapa: Etapa;
  valorAbono: number | null;
  valorProyecto: number | null;
  probabilidad: number | null;
  etapaDesde: string;
  creadoEn: string;
  nicho: string | null;
};

export type Actividad = { oportunidadId: string; tipo: TipoActividad; etapaAnterior: string | null; etapaNueva: string | null; creadoEn: string };

const MS_HORA = 3_600_000;

/** Horas hábiles entre dos instantes: solo las de lunes a viernes, en hora de Buenos Aires (UTC−3). */
export function horasHabiles(desde: string, hasta: string): number {
  const inicio = Date.parse(desde);
  const fin = Date.parse(hasta);
  if (!(fin > inicio)) return 0;
  let total = 0;
  // De a tramos que cortan en cada medianoche de Buenos Aires.
  for (let t = inicio; t < fin; ) {
    const ba = new Date(t - 3 * MS_HORA);
    const finDelDia = Date.UTC(ba.getUTCFullYear(), ba.getUTCMonth(), ba.getUTCDate() + 1) + 3 * MS_HORA;
    const corte = Math.min(fin, finDelDia);
    const dia = ba.getUTCDay();
    if (dia !== 0 && dia !== 6) total += (corte - t) / MS_HORA;
    t = corte;
  }
  return Math.round(total * 10) / 10;
}

/** Días hábiles (lunes a viernes) en la etapa actual. */
export const diasEnEtapa = (o: Pick<Oportunidad, "etapaDesde">, ahora: string) => Math.floor(horasHabiles(o.etapaDesde, ahora) / 24);
export const estancada = (o: Pick<Oportunidad, "etapa" | "etapaDesde">, ahora: string) => diasEnEtapa(o, ahora) > UMBRAL_DIAS[o.etapa];

/** El valor de una oportunidad en un año: el abono por 12 más el proyecto. */
export const valorAnual = (o: Pick<Oportunidad, "valorAbono" | "valorProyecto">) => (o.valorAbono ?? 0) * 12 + (o.valorProyecto ?? 0);
export const probabilidadDe = (o: Pick<Oportunidad, "etapa" | "probabilidad">) => (o.etapa === "ganado" ? 100 : o.etapa === "perdido" ? 0 : (o.probabilidad ?? PROBABILIDAD[o.etapa]));
/** Valor ponderado del pipeline: lo abierto, por su probabilidad. */
export const valorPonderado = (ops: Array<Pick<Oportunidad, "etapa" | "probabilidad" | "valorAbono" | "valorProyecto">>) =>
  ops.filter((o) => o.etapa !== "ganado" && o.etapa !== "perdido").reduce((s, o) => s + (valorAnual(o) * probabilidadDe(o)) / 100, 0);

/**
 * La etapa más avanzada a la que llegó cada oportunidad (por el historial
 * y la etapa actual). Una perdida cuenta hasta la etapa en la que se perdió.
 */
export function etapaMaxima(o: Pick<Oportunidad, "id" | "etapa">, actividades: Actividad[]): number {
  const orden = (e: string | null) => (e && esEtapa(e) && e !== "perdido" ? ETAPAS.indexOf(e) : -1);
  let maxima = orden(o.etapa);
  for (const a of actividades) {
    if (a.oportunidadId !== o.id || a.tipo !== "cambio_etapa") continue;
    maxima = Math.max(maxima, orden(a.etapaNueva), orden(a.etapaAnterior));
  }
  return Math.max(0, maxima);
}

export type PasoEmbudo = { etapa: Etapa; llegaron: number; tasa: Proporcion | null };

/** Cuántas llegaron a cada etapa y la tasa de paso desde la anterior (Wilson). */
export function embudoComercial(ops: Array<Pick<Oportunidad, "id" | "etapa">>, actividades: Actividad[]): PasoEmbudo[] {
  const maximas = ops.map((o) => etapaMaxima(o, actividades));
  const pasos = ETAPAS.filter((e) => e !== "perdido");
  return pasos.map((etapa, i) => {
    const llegaron = maximas.filter((m) => m >= i).length;
    const antes = i === 0 ? null : maximas.filter((m) => m >= i - 1).length;
    return { etapa, llegaron, tasa: antes === null ? null : wilson(llegaron, antes) };
  });
}

/** Días promedio que se pasa en cada etapa (por los cambios de etapa del historial). */
export function tiempoPorEtapa(actividades: Actividad[], creadas: Map<string, string>): Partial<Record<Etapa, number>> {
  const porOp = new Map<string, Actividad[]>();
  for (const a of actividades) if (a.tipo === "cambio_etapa") porOp.set(a.oportunidadId, [...(porOp.get(a.oportunidadId) ?? []), a]);
  const suma: Partial<Record<Etapa, { dias: number; n: number }>> = {};
  for (const [id, cambios] of porOp) {
    cambios.sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
    let desde = creadas.get(id);
    for (const c of cambios) {
      const etapa = c.etapaAnterior;
      if (desde && etapa && esEtapa(etapa)) {
        const dias = horasHabiles(desde, c.creadoEn) / 24;
        const s = (suma[etapa] ??= { dias: 0, n: 0 });
        s.dias += dias;
        s.n++;
      }
      desde = c.creadoEn;
    }
  }
  return Object.fromEntries(Object.entries(suma).map(([e, s]) => [e, Math.round((s!.dias / s!.n) * 10) / 10]));
}

/** Horas hábiles desde que se creó hasta la primera actividad de contacto (null si todavía no hubo). */
export function horasAlPrimerContacto(o: Pick<Oportunidad, "id" | "creadoEn">, actividades: Actividad[]): number | null {
  const primera = actividades
    .filter((a) => a.oportunidadId === o.id && CONTACTOS.includes(a.tipo))
    .map((a) => a.creadoEn)
    .sort()[0];
  return primera ? horasHabiles(o.creadoEn, primera) : null;
}

/** Las demos (o propuestas) de un período: actividad de ese tipo o cambio a esa etapa, una por oportunidad y día. */
export function contarHitos(actividades: Actividad[], tipo: "demo" | "propuesta", desdeDia: string, hastaDia: string, diaDe: (iso: string) => string): number {
  const etapa = tipo === "demo" ? "demo_hecha" : "propuesta";
  const claves = new Set<string>();
  for (const a of actividades) {
    const esHito = a.tipo === tipo || (a.tipo === "cambio_etapa" && a.etapaNueva === etapa);
    if (!esHito) continue;
    const dia = diaDe(a.creadoEn);
    if (dia < desdeDia || dia > hastaDia) continue;
    claves.add(`${a.oportunidadId}|${dia}`);
  }
  return claves.size;
}

/** El link de WhatsApp para escribirle (solo un link, sin integración). */
export function linkWhatsApp(telefono: string | null, texto: string): string | null {
  if (!telefono) return null;
  let n = telefono.replace(/\D/g, "");
  if (n.length < 8) return null;
  // Argentina: con 54 y el 9 de celular delante del código de área.
  if (n.startsWith("0")) n = n.slice(1);
  if (!n.startsWith("54")) n = `549${n.replace(/^15/, "")}`;
  else if (!n.startsWith("549")) n = `549${n.slice(2)}`;
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
}
