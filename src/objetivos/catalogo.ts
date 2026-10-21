import { contarHitos, horasAlPrimerContacto, valorPonderado, type Etapa } from "../comercial/comercial";
import { contarDias, diaBA, enRango, mesDe, mesesDe, minDia, sumarDias } from "./fechas";
import type { Acumulacion, Area, DatosComercial, DatosObjetivos, Dia, Direccion, Filtros, Unidad } from "./tipos";

/**
 * El catálogo cerrado de métricas de Objetivos: cada una sabe qué mide, de
 * dónde sale el dato, qué filtros acepta y cómo se calcula. No hay fórmulas
 * escritas a mano en la pantalla: una métrica nueva se agrega acá (con su
 * prueba en catalogo.test.ts).
 *
 * Reglas: ninguna métrica lee las ventas de los clientes de Quvant (lo que
 * venden ellos en el sistema); la facturación es solo lo que cobra Quvant,
 * cargado a mano. Los datos de Núcleos son de uso, no de plata.
 */

export type Contexto = {
  /** El período del objetivo, ambos días incluidos. */
  desde: Dia;
  hasta: Dia;
  /** Hasta dónde hay datos: el menor entre `hasta` y hoy. */
  corte: Dia;
  filtros: Filtros;
  metaId: string;
  acumulacion: Acumulacion;
};

export type FiltroAceptado = "nicho" | "socio" | "tipo" | "objetivo";

export type Metrica = {
  clave: string;
  nombre: string;
  /** Una línea: qué mide y de dónde sale (se ve al elegirla). */
  explicacion: string;
  unidad: Unidad;
  area: Area;
  filtros: FiltroAceptado[];
  /** Automática (sale de los datos) o manual (se carga el avance a mano). */
  automatica: boolean;
  /** Sin fuente todavía: manual hasta que exista la sección que la mide. */
  sinFuente?: boolean;
  /** El ritmo esperado: días hábiles (comercial) o corridos (web). */
  ritmo: "habiles" | "corridos";
  acumulacion: Acumulacion;
  direccion: Direccion;
  /** null: no hay datos para calcularla (por ejemplo, 0 visitas para una conversión). */
  calcular: (datos: DatosObjetivos, c: Contexto) => number | null;
};

// ── Ayudas ────────────────────────────────────────────────────────────
const enPeriodo = (dia: Dia, c: Contexto) => enRango(dia, c.desde, c.corte);
const suma = (valores: number[]) => valores.reduce((s, v) => s + v, 0);
const porcentaje = (parte: number, total: number) => (total > 0 ? (parte / total) * 100 : null);
const redondear = (n: number, decimales = 2) => Math.round(n * 10 ** decimales) / 10 ** decimales;

/** Un cliente está activo un día si ya tuvo el alta y todavía no la baja. */
const activoEl = (cliente: DatosObjetivos["clientes"][number], dia: Dia) => cliente.alta !== null && cliente.alta <= dia && (cliente.baja === null || cliente.baja > dia);
const delNicho = (nicho: string | null | undefined, c: Contexto) => !c.filtros.nicho || nicho === c.filtros.nicho;

const cobrosDelPeriodo = (d: DatosObjetivos, c: Contexto) =>
  d.cobros.filter((x) => x.cobrado && enPeriodo(x.fecha, c) && delNicho(x.nicho, c) && (!c.filtros.tipo || x.tipo === c.filtros.tipo));

/** Las métricas manuales: según la acumulación del objetivo, la suma, el último valor o el promedio de lo cargado. */
function manual(d: DatosObjetivos, c: Contexto): number | null {
  const propios = d.avances.filter((a) => a.metaId === c.metaId && enPeriodo(a.fecha, c)).sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (c.acumulacion === "suma_del_periodo") return suma(propios.map((a) => a.valor));
  if (propios.length === 0) return null;
  if (c.acumulacion === "valor_al_cierre") return propios[propios.length - 1].valor;
  return redondear(suma(propios.map((a) => a.valor)) / propios.length);
}

/** La última foto de salud de cada cliente hasta el corte (filtro de nicho = núcleo). */
function ultimaSalud(d: DatosObjetivos, c: Contexto) {
  const ultima = new Map<string, DatosObjetivos["saludClientes"][number]>();
  for (const f of d.saludClientes) {
    if (f.dia > c.corte || !delNicho(f.nucleo, c)) continue;
    const previa = ultima.get(f.clienteId);
    if (!previa || previa.dia < f.dia) ultima.set(f.clienteId, f);
  }
  return [...ultima.values()];
}

const registrosDe = (d: DatosObjetivos, c: Contexto) =>
  d.personas.filter((p) => enPeriodo(p.creado, c) && delNicho(p.nicho, c) && (!c.filtros.objetivo || p.objetivo === c.filtros.objetivo));

/** La actividad de las oportunidades del rubro del filtro (o de todas). */
const actividadesDelNicho = (com: DatosComercial, c: Contexto) => {
  if (!c.filtros.nicho) return com.actividades;
  const ids = new Set(com.oportunidades.filter((o) => o.nicho === c.filtros.nicho).map((o) => o.id));
  return com.actividades.filter((a) => ids.has(a.oportunidadId));
};

const visitantesDe = (d: DatosObjetivos, c: Contexto) => new Set(d.visitantes.filter((v) => enPeriodo(v.dia, c)).map((v) => v.id)).size;

// ── El catálogo ───────────────────────────────────────────────────────
const base = { automatica: true, ritmo: "habiles", direccion: "mas_es_mejor" } as const;

export const METRICAS: Metrica[] = [
  {
    ...base,
    clave: "facturacion_cobrada",
    nombre: "Facturación cobrada",
    explicacion: "Suma de lo que cobró Quvant en el período. Se carga a mano en Facturación.",
    unidad: "ars",
    area: "facturacion",
    filtros: ["tipo", "nicho"],
    acumulacion: "suma_del_periodo",
    calcular: (d, c) => suma(cobrosDelPeriodo(d, c).map((x) => x.montoArs)),
  },
  {
    ...base,
    clave: "facturacion_usd",
    nombre: "Facturación en dólares",
    explicacion: "Lo cobrado, pasado a dólares con el tipo de cambio cargado de cada mes. Sin tipo de cambio, no se calcula.",
    unidad: "usd",
    area: "facturacion",
    filtros: ["tipo", "nicho"],
    acumulacion: "suma_del_periodo",
    calcular: (d, c) => {
      const cobros = cobrosDelPeriodo(d, c);
      if (cobros.some((x) => !d.tiposCambio[mesDe(x.fecha)])) return null;
      return redondear(suma(cobros.map((x) => x.montoArs / d.tiposCambio[mesDe(x.fecha)])));
    },
  },
  {
    ...base,
    clave: "mrr",
    nombre: "MRR (ingreso mensual recurrente)",
    explicacion: "Suma de los abonos mensuales de los clientes activos al cierre. Sale de los clientes por plantilla.",
    unidad: "ars",
    area: "facturacion",
    filtros: ["nicho"],
    acumulacion: "valor_al_cierre",
    calcular: (d, c) => suma(d.clientes.filter((x) => activoEl(x, c.corte) && delNicho(x.nicho, c)).map((x) => x.abono ?? 0)),
  },
  {
    ...base,
    clave: "peso_recurrente",
    nombre: "Peso de los abonos en la facturación",
    explicacion: "Qué parte de lo cobrado son abonos mensuales (el resto, proyectos e implementaciones).",
    unidad: "porcentaje",
    area: "facturacion",
    filtros: ["nicho"],
    acumulacion: "promedio",
    calcular: (d, c) => {
      const cobros = cobrosDelPeriodo(d, { ...c, filtros: { ...c.filtros, tipo: undefined } });
      const total = suma(cobros.map((x) => x.montoArs));
      const abonos = suma(cobros.filter((x) => x.tipo === "abono_mensual").map((x) => x.montoArs));
      const p = porcentaje(abonos, total);
      return p === null ? null : redondear(p, 1);
    },
  },
  {
    ...base,
    clave: "clientes_activos",
    nombre: "Clientes de sistema pagando",
    explicacion: "Clientes activos al cierre (con alta y sin baja). Sale de los clientes por plantilla.",
    unidad: "numero",
    area: "clientes",
    filtros: ["nicho"],
    acumulacion: "valor_al_cierre",
    calcular: (d, c) => d.clientes.filter((x) => activoEl(x, c.corte) && delNicho(x.nicho, c)).length,
  },
  {
    ...base,
    clave: "clientes_ganados",
    nombre: "Clientes ganados",
    explicacion: "Altas de clientes en el período.",
    unidad: "numero",
    area: "clientes",
    filtros: ["nicho"],
    acumulacion: "suma_del_periodo",
    calcular: (d, c) => d.clientes.filter((x) => x.alta !== null && enPeriodo(x.alta, c) && delNicho(x.nicho, c)).length,
  },
  {
    ...base,
    clave: "churn_mensual",
    nombre: "Churn mensual",
    explicacion: "Bajas sobre los activos al empezar, promediado por mes. Menos es mejor.",
    unidad: "porcentaje",
    area: "clientes",
    filtros: ["nicho"],
    acumulacion: "promedio",
    direccion: "menos_es_mejor",
    calcular: (d, c) => {
      const delRubro = d.clientes.filter((x) => delNicho(x.nicho, c));
      const alEmpezar = delRubro.filter((x) => activoEl(x, sumarDias(c.desde, -1))).length;
      const bajas = delRubro.filter((x) => x.baja !== null && enPeriodo(x.baja, c) && x.alta !== null && x.alta < c.desde).length;
      if (alEmpezar === 0) return null;
      return redondear((bajas / alEmpezar / mesesDe(c.desde, c.corte)) * 100, 1);
    },
  },
  {
    ...base,
    clave: "proyectos_vendidos",
    nombre: "Proyectos vendidos",
    explicacion: "Webs y apps a medida cobradas (cada cliente cuenta una vez por tipo, aunque pague en cuotas).",
    unidad: "numero",
    area: "facturacion",
    filtros: ["tipo", "nicho"],
    acumulacion: "suma_del_periodo",
    calcular: (d, c) =>
      new Set(
        cobrosDelPeriodo(d, c)
          .filter((x) => (c.filtros.tipo ? true : x.tipo === "web" || x.tipo === "app_a_medida"))
          .map((x) => `${x.tipo}|${x.cliente.trim().toLowerCase()}`),
      ).size,
  },
  {
    ...base,
    ritmo: "corridos",
    clave: "visitas_web",
    nombre: "Visitas a la web",
    explicacion: "Personas distintas que entraron a la web (cada navegador cuenta una vez; sin el equipo ni robots).",
    unidad: "numero",
    area: "web",
    filtros: [],
    acumulacion: "suma_del_periodo",
    calcular: (d, c) => visitantesDe(d, c),
  },
  {
    ...base,
    ritmo: "corridos",
    clave: "registros",
    nombre: "Registros web",
    explicacion: "Personas que crearon su cuenta (sin las de admin).",
    unidad: "numero",
    area: "web",
    filtros: ["nicho", "objetivo"],
    acumulacion: "suma_del_periodo",
    calcular: (d, c) => registrosDe(d, c).length,
  },
  {
    ...base,
    ritmo: "corridos",
    clave: "registros_confirmados",
    nombre: "Registros con email confirmado",
    explicacion: "Personas que confirmaron su email en el período.",
    unidad: "numero",
    area: "web",
    filtros: ["nicho", "objetivo"],
    acumulacion: "suma_del_periodo",
    calcular: (d, c) =>
      d.personas.filter((p) => p.confirmado !== null && enPeriodo(p.confirmado, c) && delNicho(p.nicho, c) && (!c.filtros.objetivo || p.objetivo === c.filtros.objetivo)).length,
  },
  {
    ...base,
    ritmo: "corridos",
    clave: "conversion_web",
    nombre: "Conversión de la web",
    explicacion: "Registros sobre visitantes únicos del período.",
    unidad: "porcentaje",
    area: "web",
    filtros: [],
    acumulacion: "promedio",
    calcular: (d, c) => {
      const p = porcentaje(registrosDe(d, { ...c, filtros: {} }).length, visitantesDe(d, c));
      return p === null ? null : redondear(p, 2);
    },
  },
  {
    ...base,
    clave: "demos",
    nombre: "Demos realizadas",
    explicacion: "Del seguimiento comercial: actividades de demo o pasos a «demo hecha» del período (una por oportunidad y día).",
    unidad: "numero",
    area: "comercial",
    filtros: ["nicho"],
    acumulacion: "suma_del_periodo",
    calcular: (d, c) => (d.comercial ? contarHitos(actividadesDelNicho(d.comercial, c), "demo", c.desde, c.corte, diaBA) : manual(d, c)),
  },
  {
    ...base,
    clave: "propuestas",
    nombre: "Propuestas enviadas",
    explicacion: "Del seguimiento comercial: propuestas enviadas o pasos a «propuesta» del período.",
    unidad: "numero",
    area: "comercial",
    filtros: ["nicho"],
    acumulacion: "suma_del_periodo",
    calcular: (d, c) => (d.comercial ? contarHitos(actividadesDelNicho(d.comercial, c), "propuesta", c.desde, c.corte, diaBA) : manual(d, c)),
  },
  {
    ...base,
    clave: "tiempo_primer_contacto",
    nombre: "Tiempo hasta el primer contacto",
    explicacion: "Del seguimiento comercial: horas hábiles promedio desde que entra una oportunidad hasta la primera llamada, mensaje, reunión o demo. Menos es mejor.",
    unidad: "horas",
    area: "comercial",
    filtros: ["nicho"],
    acumulacion: "promedio",
    direccion: "menos_es_mejor",
    calcular: (d, c) => {
      if (!d.comercial) return manual(d, c);
      const horas = d.comercial.oportunidades
        .filter((o) => enPeriodo(diaBA(o.creadoEn), c) && delNicho(o.nicho, c))
        .flatMap((o) => {
          const h = horasAlPrimerContacto(o, d.comercial!.actividades);
          return h === null ? [] : [h];
        });
      return horas.length ? redondear(suma(horas) / horas.length, 1) : null;
    },
  },
  {
    ...base,
    clave: "oportunidades_ganadas",
    nombre: "Oportunidades ganadas",
    explicacion: "Del seguimiento comercial: oportunidades que pasaron a «ganado» en el período.",
    unidad: "numero",
    area: "comercial",
    filtros: ["nicho"],
    acumulacion: "suma_del_periodo",
    calcular: (d, c) =>
      d.comercial
        ? new Set(actividadesDelNicho(d.comercial, c).filter((a) => a.tipo === "cambio_etapa" && a.etapaNueva === "ganado" && enPeriodo(diaBA(a.creadoEn), c)).map((a) => a.oportunidadId)).size
        : null,
  },
  {
    ...base,
    clave: "valor_pipeline",
    nombre: "Valor del pipeline (ponderado)",
    explicacion: "Del seguimiento comercial: lo abierto hoy, por su probabilidad (abono por 12 más el proyecto).",
    unidad: "ars",
    area: "comercial",
    filtros: ["nicho"],
    acumulacion: "valor_al_cierre",
    calcular: (d, c) =>
      d.comercial ? Math.round(valorPonderado(d.comercial.oportunidades.filter((o) => delNicho(o.nicho, c)).map((o) => ({ ...o, etapa: o.etapa as Etapa })))) : null,
  },
  {
    ...base,
    clave: "visitas_locales",
    nombre: "Visitas en persona a locales",
    explicacion: "Visitas cargadas en el mapa de prospección.",
    unidad: "numero",
    area: "calle",
    filtros: ["socio", "nicho"],
    acumulacion: "suma_del_periodo",
    calcular: (d, c) => d.visitasLocales.filter((v) => enPeriodo(v.fecha, c) && delNicho(v.nicho, c) && (!c.filtros.socio || v.socio === c.filtros.socio)).length,
  },
  {
    ...base,
    clave: "locales_nuevos",
    nombre: "Locales nuevos en el mapa",
    explicacion: "Locales cargados en el mapa de prospección.",
    unidad: "numero",
    area: "calle",
    filtros: ["nicho"],
    acumulacion: "suma_del_periodo",
    calcular: (d, c) => d.locales.filter((l) => enPeriodo(l.creado, c) && delNicho(l.nicho, c)).length,
  },
  {
    ...base,
    clave: "visitas_con_feedback_bueno",
    nombre: "Visitas con feedback bueno",
    explicacion: "Qué parte de las visitas a locales salió bien.",
    unidad: "porcentaje",
    area: "calle",
    filtros: ["socio", "nicho"],
    acumulacion: "promedio",
    calcular: (d, c) => {
      const visitas = d.visitasLocales.filter((v) => enPeriodo(v.fecha, c) && delNicho(v.nicho, c) && (!c.filtros.socio || v.socio === c.filtros.socio));
      const p = porcentaje(visitas.filter((v) => v.feedback === "bueno").length, visitas.length);
      return p === null ? null : redondear(p, 1);
    },
  },
  {
    ...base,
    clave: "salud_promedio_nucleos",
    nombre: "Salud promedio de los clientes",
    explicacion: "Salud de uso del sistema (de 0 a 100) según Núcleos, al cierre. Mide uso, no ventas.",
    unidad: "numero",
    area: "nucleos",
    filtros: ["nicho"],
    acumulacion: "valor_al_cierre",
    calcular: (d, c) => {
      const saludes = ultimaSalud(d, c).flatMap((f) => (f.salud === null ? [] : [f.salud]));
      return saludes.length ? redondear(suma(saludes) / saludes.length, 1) : null;
    },
  },
  {
    ...base,
    clave: "clientes_verdes",
    nombre: "Clientes en verde",
    explicacion: "Qué parte de los clientes está en verde en Núcleos, al cierre.",
    unidad: "porcentaje",
    area: "nucleos",
    filtros: ["nicho"],
    acumulacion: "valor_al_cierre",
    calcular: (d, c) => {
      const fotos = ultimaSalud(d, c).filter((f) => f.semaforo !== "arranque");
      const p = porcentaje(fotos.filter((f) => f.semaforo === "verde").length, fotos.length);
      return p === null ? null : redondear(p, 1);
    },
  },
  {
    ...base,
    clave: "alertas_resueltas",
    nombre: "Alertas de Núcleos resueltas",
    explicacion: "Qué parte de las alertas del período se resolvió.",
    unidad: "porcentaje",
    area: "nucleos",
    filtros: ["nicho"],
    acumulacion: "promedio",
    calcular: (d, c) => {
      const alertas = d.alertas.filter((a) => enPeriodo(a.fecha, c) && delNicho(a.nucleo, c));
      const p = porcentaje(alertas.filter((a) => a.resuelta).length, alertas.length);
      return p === null ? null : redondear(p, 1);
    },
  },
  {
    ...base,
    automatica: false,
    sinFuente: true,
    clave: "recomendaciones_hechas",
    nombre: "Recomendaciones hechas",
    explicacion: "Sin fuente todavía (falta la sección Análisis): se carga a mano.",
    unidad: "numero",
    area: "comercial",
    filtros: [],
    acumulacion: "suma_del_periodo",
    calcular: manual,
  },
  {
    ...base,
    automatica: false,
    clave: "manual",
    nombre: "Otra (se carga a mano)",
    explicacion: "Cualquier otra cosa: publicaciones en Instagram, casos publicados, recomendaciones de clientes…",
    unidad: "numero",
    area: "comercial",
    filtros: [],
    acumulacion: "suma_del_periodo",
    calcular: manual,
  },
];

export const METRICA = Object.fromEntries(METRICAS.map((m) => [m.clave, m])) as Record<string, Metrica>;
export const esMetrica = (clave: string) => clave in METRICA;

/** El valor de una métrica para un objetivo, hasta un día (por defecto, el corte del período). */
export function calcularValor(datos: DatosObjetivos, meta: { id: string; metrica: string; filtros: Filtros; desde: Dia; hasta: Dia; acumulacion: Acumulacion }, hoy: Dia, hastaElDia?: Dia) {
  const metrica = METRICA[meta.metrica];
  if (!metrica) return null;
  const corte = minDia(hastaElDia ?? meta.hasta, minDia(meta.hasta, hoy));
  if (corte < meta.desde) return metrica.acumulacion === "suma_del_periodo" && metrica.automatica ? 0 : null;
  return metrica.calcular(datos, { desde: meta.desde, hasta: meta.hasta, corte, filtros: meta.filtros, metaId: meta.id, acumulacion: meta.acumulacion });
}

/** Días hábiles o corridos del período (para el ritmo). */
export const diasDelPeriodo = (desde: Dia, hasta: Dia, ritmo: Metrica["ritmo"]) => contarDias(desde, hasta, ritmo === "habiles");
