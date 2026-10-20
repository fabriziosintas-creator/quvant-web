import { METRICA } from "./catalogo";
import { ABONO_DEL_PLAN, CASOS_MINIMOS, TASAS_DEL_PLAN } from "./configuracion";
import { enRango, sumarDias } from "./fechas";
import type { DatosObjetivos, Dia, Meta } from "./tipos";

/**
 * El embudo al revés: "¿qué nos falta para llegar?". A partir de lo que
 * falta en clientes, MRR o facturación, cuántas demos, visitas a locales,
 * registros y visitas a la web hacen falta.
 *
 * Usa las tasas reales de los últimos 90 días; si un paso tiene menos de
 * CASOS_MINIMOS casos, usa la tasa del plan y lo dice.
 */

export type Tasa = { valor: number; propia: boolean; casos: number };

export type Tasas = {
  webARegistro: Tasa;
  localADemo: Tasa;
  registroADemo: Tasa;
  demoACliente: Tasa;
};

export type Embudo = {
  clientes: number;
  demos: number;
  /** Camino de la calle: visitas a locales para esas demos. */
  visitasLocales: number;
  /** Camino de la web: registros y visitas a la web para esas demos. */
  registros: number;
  visitasWeb: number;
  tasas: Tasas;
  /** Con qué abono se pasó el MRR (o la facturación) a clientes. */
  abonoUsado: number | null;
};

const tasa = (parte: number, casos: number, delPlan: number): Tasa =>
  casos >= CASOS_MINIMOS && parte > 0 ? { valor: parte / casos, propia: true, casos } : { valor: delPlan, propia: false, casos };

/**
 * Las tasas de los últimos 90 días. Las demos no tienen fuente automática
 * todavía: se toman de los avances cargados a mano en objetivos de demos.
 */
export function tasasReales(datos: DatosObjetivos, hoy: Dia, metas: Meta[]): Tasas {
  const desde = sumarDias(hoy, -90);
  const en = (dia: Dia) => enRango(dia, desde, hoy);
  const visitantes = new Set(datos.visitantes.filter((v) => en(v.dia)).map((v) => v.id)).size;
  const registros = datos.personas.filter((p) => en(p.creado)).length;
  const visitasLocales = datos.visitasLocales.filter((v) => en(v.fecha)).length;
  const idsDemos = new Set(metas.filter((m) => m.metrica === "demos").map((m) => m.id));
  const demos = datos.avances.filter((a) => idsDemos.has(a.metaId) && en(a.fecha)).reduce((s, a) => s + a.valor, 0);
  const clientes = datos.clientes.filter((c) => c.alta !== null && en(c.alta)).length;
  return {
    webARegistro: tasa(registros, visitantes, TASAS_DEL_PLAN.webARegistro),
    localADemo: tasa(demos, visitasLocales, TASAS_DEL_PLAN.localADemo),
    registroADemo: tasa(demos, registros, TASAS_DEL_PLAN.registroADemo),
    demoACliente: tasa(clientes, demos, TASAS_DEL_PLAN.demoACliente),
  };
}

/** El abono promedio de los activos (o el del plan si todavía no hay). */
export function abonoPromedio(datos: DatosObjetivos, hoy: Dia) {
  const abonos = datos.clientes.filter((c) => c.alta !== null && c.alta <= hoy && (c.baja === null || c.baja > hoy) && (c.abono ?? 0) > 0).map((c) => c.abono!);
  return abonos.length ? abonos.reduce((s, a) => s + a, 0) / abonos.length : ABONO_DEL_PLAN;
}

/** Qué métricas tienen embudo: las de clientes y plata. */
export const tieneEmbudo = (meta: Meta) => ["clientes_activos", "clientes_ganados", "mrr", "facturacion_cobrada"].includes(meta.metrica) && meta.direccion === "mas_es_mejor";

/** Cuánto hace falta, de abajo hacia arriba, para lo que le falta a la meta. */
export function embudoAlReves(meta: Meta, falta: number, tasas: Tasas, abono: number): Embudo {
  const plata = METRICA[meta.metrica]?.unidad === "ars";
  // La facturación se pasa a clientes como si fueran abonos (lo más conservador: sin proyectos).
  const clientes = Math.max(0, Math.ceil(plata ? falta / abono : falta));
  const demos = Math.ceil(clientes / tasas.demoACliente.valor);
  const registros = Math.ceil(demos / tasas.registroADemo.valor);
  return {
    clientes,
    demos,
    visitasLocales: Math.ceil(demos / tasas.localADemo.valor),
    registros,
    visitasWeb: Math.ceil(registros / tasas.webARegistro.valor),
    tasas,
    abonoUsado: plata ? abono : null,
  };
}
