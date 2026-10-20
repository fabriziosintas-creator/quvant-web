import { METRICA, calcularValor, diasDelPeriodo } from "./catalogo";
import { UMBRALES } from "./configuracion";
import { cadaDia, minDia, sumarDias } from "./fechas";
import type { DatosObjetivos, Dia, EstadoMeta, Meta } from "./tipos";

/**
 * El estado de un objetivo abierto: cuánto va, qué se esperaba a esta
 * altura, si está cumplido, en camino, en riesgo o atrasado, y a dónde
 * llegaría si sigue así.
 */

export type Avance = {
  valor: number | null;
  /** Valor real / meta (con "menos es mejor", invertido). 1 = cumplido. */
  avance: number | null;
  /** Parte del período transcurrida (0 a 1), en días hábiles o corridos según la métrica. */
  transcurrido: number;
  /** El valor que se esperaba a hoy si se iba al ritmo justo. */
  esperado: number | null;
  /** A dónde llega al cierre si sigue al ritmo actual. */
  proyeccion: number | null;
  /** Lo que falta para la meta (0 si ya está). */
  falta: number | null;
  diasRestantes: number;
  /** "habiles" o "corridos", para decir "te faltan 12 visitas en 9 días hábiles". */
  ritmo: "habiles" | "corridos";
  estado: EstadoMeta;
  abierto: boolean;
  /** El valor al empezar el período (para las métricas "al cierre", como MRR). */
  inicio: number | null;
};

/** El valor de una métrica "al cierre" el día antes de empezar (MRR, clientes activos…). */
export function valorAlInicio(datos: DatosObjetivos, meta: Meta): number | null {
  const metrica = METRICA[meta.metrica];
  if (!metrica || meta.acumulacion !== "valor_al_cierre" || !metrica.automatica) return null;
  return metrica.calcular(datos, { desde: meta.desde, hasta: meta.hasta, corte: sumarDias(meta.desde, -1), filtros: meta.filtros, metaId: meta.id, acumulacion: meta.acumulacion });
}

export function calcularAvance(datos: DatosObjetivos, meta: Meta, hoy: Dia): Avance {
  const metrica = METRICA[meta.metrica];
  const ritmo = metrica?.ritmo ?? "habiles";
  const abierto = hoy <= meta.hasta;
  const corte = minDia(hoy, meta.hasta);
  const total = diasDelPeriodo(meta.desde, meta.hasta, ritmo);
  const pasados = hoy < meta.desde ? 0 : diasDelPeriodo(meta.desde, corte, ritmo);
  const transcurrido = total > 0 ? Math.min(1, pasados / total) : 1;
  const diasRestantes = abierto ? diasDelPeriodo(hoy < meta.desde ? meta.desde : sumarDias(hoy, 1), meta.hasta, ritmo) : 0;

  const valor = hoy < meta.desde ? null : calcularValor(datos, meta, hoy);
  const inicio = valorAlInicio(datos, meta);
  const base: Omit<Avance, "estado" | "avance" | "esperado" | "proyeccion" | "falta"> = { valor, transcurrido, diasRestantes, ritmo, abierto, inicio };

  if (valor === null || (meta.meta <= 0 && meta.direccion === "mas_es_mejor")) {
    return { ...base, avance: null, esperado: null, proyeccion: null, falta: null, estado: hoy < meta.desde ? "por_empezar" : "sin_datos" };
  }

  // ── Menos es mejor (churn, tiempo de respuesta): cumplir es quedar por debajo.
  if (meta.direccion === "menos_es_mejor") {
    const avance = valor <= 0 ? 1 : Math.min(1, meta.meta / valor);
    const falta = Math.max(0, valor - meta.meta);
    let estado: EstadoMeta;
    if (!abierto) estado = valor <= meta.meta ? "cumplido" : "no_cumplido";
    else if (valor <= meta.meta) estado = "en_camino";
    else if (valor <= meta.meta * (1 + UMBRALES.margenMenos)) estado = "en_riesgo";
    else estado = "atrasado";
    return { ...base, avance, esperado: meta.meta, proyeccion: valor, falta, estado };
  }

  // ── Más es mejor.
  const avance = valor / meta.meta;
  const falta = Math.max(0, meta.meta - valor);
  let esperado: number;
  let proyeccion: number;
  let ritmoLogrado: number;

  if (meta.acumulacion === "suma_del_periodo") {
    esperado = meta.meta * transcurrido;
    proyeccion = transcurrido > 0 ? valor / transcurrido : valor;
    ritmoLogrado = esperado > 0 ? valor / esperado : 1;
  } else if (meta.acumulacion === "valor_al_cierre") {
    // Una recta desde el valor al empezar hasta la meta.
    const desde = inicio ?? 0;
    esperado = desde + (meta.meta - desde) * transcurrido;
    proyeccion = transcurrido > 0 ? desde + (valor - desde) / transcurrido : valor;
    const tramo = esperado - desde;
    ritmoLogrado = meta.meta <= desde ? (valor >= meta.meta ? 1 : 0) : tramo > 0 ? (valor - desde) / tramo : 1;
  } else {
    // Promedios y tasas: no se acumulan, se comparan directo contra la meta.
    esperado = meta.meta;
    proyeccion = valor;
    ritmoLogrado = valor / meta.meta;
  }

  let estado: EstadoMeta;
  if (valor >= meta.meta) estado = "cumplido";
  else if (!abierto) estado = "no_cumplido";
  else if (meta.acumulacion !== "promedio" && transcurrido < UMBRALES.gracia) estado = "en_camino";
  else if (ritmoLogrado >= UMBRALES.enCamino) estado = "en_camino";
  else if (ritmoLogrado >= UMBRALES.enRiesgo) estado = "en_riesgo";
  else estado = "atrasado";

  return { ...base, avance, esperado, proyeccion, falta, estado };
}

/** La curva real día por día (para el sparkline y el gráfico del detalle), hasta hoy. */
export function serieReal(datos: DatosObjetivos, meta: Meta, hoy: Dia): Array<{ dia: Dia; valor: number | null }> {
  if (hoy < meta.desde) return [];
  return cadaDia(meta.desde, minDia(hoy, meta.hasta)).map((dia) => ({ dia, valor: calcularValor(datos, meta, hoy, dia) }));
}

/** Resultado para guardar al cerrar: cumplido o no. */
export function resultadoDelCierre(meta: Meta, valor: number | null): "cumplido" | "no_cumplido" {
  if (valor === null) return "no_cumplido";
  return meta.direccion === "menos_es_mejor" ? (valor <= meta.meta ? "cumplido" : "no_cumplido") : valor >= meta.meta ? "cumplido" : "no_cumplido";
}
