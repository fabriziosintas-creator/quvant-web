"use server";

import { revalidatePath, updateTag } from "next/cache";
import { PANEL_ADMIN } from "@/datos/textos";
import { METRICA, esMetrica, type FiltroAceptado } from "@/objetivos/catalogo";
import { abonoPromedio, embudoAlReves, tasasReales, tieneEmbudo } from "@/objetivos/embudo";
import { calcularAvance } from "@/objetivos/estado";
import { limitesDelMes } from "@/objetivos/fechas";
import { PLAN_INICIAL, completarDelPlan } from "@/objetivos/plan";
import type { Filtros } from "@/objetivos/tipos";
import { esNicho, esObjetivo, marcado, texto, uuidValido, type Errores } from "@/servidor/cuenta/validacion";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { cargarDatos, cargarMeta, cargarMetas, desdeNecesario } from "./datos";
import { cerrarPeriodos, fotografiar, hoyBA } from "./proceso";

/**
 * Las acciones de Objetivos: cobros, tipo de cambio, avances manuales,
 * crear y editar objetivos (con motivo si cambia la meta), archivar,
 * cargar el plan inicial, crear objetivos de actividad desde el embudo y
 * correr a mano el cierre y la foto. Todas con la sesión del admin: la
 * base (RLS) solo deja a los admin.
 */

const T = PANEL_ADMIN.objetivos;
const E = T.errores;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const RUTA = "/panel/objetivos";

export type EstadoForm = { estado: "inicial" | "error" | "listo"; mensaje?: string; errores?: Errores; valores?: Record<string, string>; id?: string };

const TIPOS_COBRO = ["abono_mensual", "implementacion", "web", "app_a_medida", "otro"] as const;
const AREAS = ["facturacion", "clientes", "web", "comercial", "calle", "nucleos"] as const;
const ETAPAS = ["90_dias", "6_meses", "12_meses", "libre"] as const;
const PERIODOS = ["semana", "mes", "trimestre", "etapa", "rango"] as const;
const UNIDADES = ["numero", "ars", "usd", "porcentaje", "horas"] as const;
const ACUMULACIONES = ["suma_del_periodo", "valor_al_cierre", "promedio"] as const;
const RESPONSABLES = ["fabrizio", "michel", "los_dos"] as const;
const de = <T extends string>(lista: readonly T[], valor: string): valor is T => (lista as readonly string[]).includes(valor);

/** "1.500.000,50", "1500000.5", "$ 150.000" → número (o NaN). */
function numeroAR(valor: string): number {
  const limpio = valor.replace(/[$\s]/g, "");
  if (limpio === "") return NaN;
  if (limpio.includes(",")) return Number(limpio.replace(/\./g, "").replace(",", "."));
  if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) return Number(limpio.replace(/\./g, ""));
  return Number(limpio);
}

// ── Facturación ───────────────────────────────────────────────────────
export async function cargarCobro(_previo: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const { supabase, perfil } = await exigirAdmin(`${RUTA}/facturacion`);
  const valores = {
    fecha: texto(datos, "fecha"),
    cliente: texto(datos, "cliente"),
    tipo: texto(datos, "tipo"),
    monto: texto(datos, "monto"),
    nicho: texto(datos, "nicho"),
    factura: texto(datos, "factura"),
    nota: texto(datos, "nota"),
  };
  const errores: Errores = {};
  if (!FECHA.test(valores.fecha)) errores.fecha = E.fecha;
  if (!valores.cliente || valores.cliente.length > 160) errores.cliente = E.cliente;
  if (!de(TIPOS_COBRO, valores.tipo)) errores.tipo = E.tipo;
  const monto = numeroAR(valores.monto);
  if (!Number.isFinite(monto) || monto < 0 || monto > 1e13) errores.monto = E.monto;
  if (valores.nicho && !esNicho(valores.nicho)) errores.nicho = E.general;
  if (valores.factura.length > 60 || valores.nota.length > 500) errores.general = E.largo;
  if (Object.keys(errores).length > 0) return { estado: "error", errores, valores };

  // Si el cliente ya está cargado en Plantillas, se enlaza (y hereda su rubro).
  const { data: conocido } = await supabase.from("clientes_plantilla").select("id, nicho_id").ilike("empresa", valores.cliente).limit(1).maybeSingle();
  const { error } = await supabase.from("cobros_quvant").insert({
    fecha: valores.fecha,
    cliente: valores.cliente,
    cliente_plantilla_id: conocido?.id ?? null,
    nicho_id: valores.nicho || conocido?.nicho_id || null,
    tipo: valores.tipo,
    monto_ars: Math.round(monto * 100) / 100,
    iva_incluido: marcado(datos, "iva"),
    cobrado: marcado(datos, "cobrado"),
    factura: valores.factura || null,
    nota: valores.nota || null,
    cargado_por: perfil.id,
  });
  if (error) {
    console.error("[objetivos] cobro:", error.message);
    return { estado: "error", mensaje: E.general, valores };
  }
  updateTag("nichos");
  revalidatePath(RUTA, "layout");
  return { estado: "listo", mensaje: T.facturacion.cargado };
}

export async function borrarCobro(datos: FormData) {
  const { supabase } = await exigirAdmin(`${RUTA}/facturacion`);
  const id = texto(datos, "id");
  if (!uuidValido(id)) return;
  const { error } = await supabase.from("cobros_quvant").delete().eq("id", id);
  if (error) console.error("[objetivos] borrar cobro:", error.message);
  updateTag("nichos");
  revalidatePath(RUTA, "layout");
}

export async function cargarTipoCambio(_previo: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const { supabase, perfil } = await exigirAdmin(`${RUTA}/facturacion`);
  const mes = texto(datos, "mes");
  const pesos = numeroAR(texto(datos, "pesos"));
  const fuente = texto(datos, "fuente");
  const errores: Errores = {};
  if (!/^\d{4}-\d{2}$/.test(mes)) errores.mes = E.mes;
  if (!Number.isFinite(pesos) || pesos <= 0 || pesos > 1e7) errores.pesos = E.monto;
  if (fuente.length > 120) errores.fuente = E.largo;
  if (Object.keys(errores).length > 0) return { estado: "error", errores, valores: { mes, pesos: texto(datos, "pesos"), fuente } };
  const { error } = await supabase.from("tipo_cambio_mensual").upsert({ mes: `${mes}-01`, pesos_por_dolar: pesos, fuente: fuente || null, cargado_por: perfil.id });
  if (error) {
    console.error("[objetivos] tipo de cambio:", error.message);
    return { estado: "error", mensaje: E.general };
  }
  updateTag("nichos");
  revalidatePath(RUTA, "layout");
  return { estado: "listo", mensaje: T.facturacion.tipoCambioCargado };
}

// ── Avances manuales ──────────────────────────────────────────────────
export async function cargarAvance(_previo: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const { supabase, perfil } = await exigirAdmin(RUTA);
  const metaId = texto(datos, "meta_id");
  const fecha = texto(datos, "fecha");
  const valor = numeroAR(texto(datos, "valor"));
  const nota = texto(datos, "nota");
  const errores: Errores = {};
  if (!uuidValido(metaId)) errores.general = E.general;
  if (!FECHA.test(fecha)) errores.fecha = E.fecha;
  if (!Number.isFinite(valor) || Math.abs(valor) > 1e13) errores.valor = E.valor;
  if (nota.length > 500) errores.nota = E.largo;
  if (Object.keys(errores).length > 0) return { estado: "error", errores, valores: { fecha, valor: texto(datos, "valor"), nota } };
  const { error } = await supabase.from("avances_manuales").insert({ meta_id: metaId, fecha, valor, nota: nota || null, cargado_por: perfil.id });
  if (error) {
    console.error("[objetivos] avance:", error.message);
    return { estado: "error", mensaje: E.general };
  }
  updateTag("nichos");
  revalidatePath(RUTA, "layout");
  return { estado: "listo", mensaje: T.detalle.avanceCargado };
}

// ── Crear y editar objetivos ──────────────────────────────────────────
function leerFiltros(datos: FormData, aceptados: FiltroAceptado[]): Filtros {
  const filtros: Filtros = {};
  const nicho = texto(datos, "filtro_nicho");
  const socio = texto(datos, "filtro_socio");
  const tipo = texto(datos, "filtro_tipo");
  const objetivo = texto(datos, "filtro_objetivo");
  if (aceptados.includes("nicho") && esNicho(nicho)) filtros.nicho = nicho;
  if (aceptados.includes("socio") && (socio === "fabrizio" || socio === "michel")) filtros.socio = socio;
  if (aceptados.includes("tipo") && de(TIPOS_COBRO, tipo)) filtros.tipo = tipo;
  if (aceptados.includes("objetivo") && esObjetivo(objetivo)) filtros.objetivo = objetivo;
  return filtros;
}

export async function guardarMeta(_previo: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const { supabase, perfil } = await exigirAdmin(RUTA);
  const id = texto(datos, "id");
  const valores = Object.fromEntries(
    ["nombre", "descripcion", "metrica", "area", "etapa", "tipo_periodo", "mes", "desde", "hasta", "meta", "unidad", "acumulacion", "direccion", "responsable", "motivo", "orden"].map((c) => [c, texto(datos, c)]),
  );
  const errores: Errores = {};
  if (!valores.nombre || valores.nombre.length > 160) errores.nombre = E.nombre;
  if (valores.descripcion.length > 500) errores.descripcion = E.largo;
  if (!esMetrica(valores.metrica)) errores.metrica = E.metrica;
  const metrica = METRICA[valores.metrica];
  if (!de(ETAPAS, valores.etapa)) errores.etapa = E.general;
  if (!de(PERIODOS, valores.tipo_periodo)) errores.tipo_periodo = E.general;
  if (!de(RESPONSABLES, valores.responsable)) errores.responsable = E.general;

  // Período: un mes elegido o un rango de fechas.
  let desde = valores.desde;
  let hasta = valores.hasta;
  if (valores.tipo_periodo === "mes" && /^\d{4}-\d{2}$/.test(valores.mes)) ({ desde, hasta } = limitesDelMes(`${valores.mes}-01`));
  if (!FECHA.test(desde) || !FECHA.test(hasta) || hasta < desde) errores.periodo = E.periodo;

  const meta = numeroAR(valores.meta);
  if (!Number.isFinite(meta) || meta < 0 || meta > 1e13) errores.meta = E.meta;

  // Unidad, acumulación y dirección: las de la métrica; en las manuales se eligen.
  const unidad = metrica && !metrica.automatica && de(UNIDADES, valores.unidad) ? valores.unidad : metrica?.unidad;
  const acumulacion = metrica && !metrica.automatica && de(ACUMULACIONES, valores.acumulacion) ? valores.acumulacion : metrica?.acumulacion;
  const direccion = metrica && !metrica.automatica && (valores.direccion === "menos_es_mejor" || valores.direccion === "mas_es_mejor") ? valores.direccion : metrica?.direccion;
  const area = de(AREAS, valores.area) ? valores.area : metrica?.area;
  if (Object.keys(errores).length > 0 || !metrica || !unidad || !acumulacion || !direccion || !area) return { estado: "error", errores, valores };

  const fila = {
    nombre: valores.nombre,
    descripcion: valores.descripcion || null,
    metrica: valores.metrica,
    filtros: leerFiltros(datos, metrica.filtros),
    area,
    etapa: valores.etapa,
    tipo_periodo: valores.tipo_periodo,
    desde,
    hasta,
    meta_valor: meta,
    unidad,
    acumulacion,
    direccion,
    responsable: valores.responsable,
    se_repite: marcado(datos, "se_repite"),
    orden: Number.isFinite(Number(valores.orden)) && valores.orden !== "" ? Math.max(0, Math.min(999, Math.round(Number(valores.orden)))) : 100,
  };

  if (!id) {
    const { data, error } = await supabase.from("metas").insert({ ...fila, meta_original: meta, creado_por: perfil.id }).select("id").single();
    if (error || !data) {
      console.error("[objetivos] crear:", error?.message);
      return { estado: "error", mensaje: E.general, valores };
    }
    updateTag("nichos");
    revalidatePath(RUTA, "layout");
    return { estado: "listo", mensaje: T.form.creado, id: data.id };
  }

  if (!uuidValido(id)) return { estado: "error", mensaje: E.general, valores };
  const anterior = await cargarMeta(supabase, id);
  if (!anterior) return { estado: "error", mensaje: E.general, valores };
  // Cambiar la meta o el período deja rastro, con motivo obligatorio.
  const cambios = [
    { campo: "meta", antes: anterior.meta, despues: meta },
    { campo: "desde", antes: anterior.desde, despues: desde },
    { campo: "hasta", antes: anterior.hasta, despues: hasta },
  ].filter((c) => String(c.antes) !== String(c.despues));
  if (cambios.length > 0 && valores.motivo.length < 3) return { estado: "error", errores: { motivo: E.motivo }, valores };

  const { error } = await supabase.from("metas").update(fila).eq("id", id);
  if (error) {
    console.error("[objetivos] editar:", error.message);
    return { estado: "error", mensaje: E.general, valores };
  }
  if (cambios.length > 0) {
    const { error: errorCambios } = await supabase
      .from("metas_cambios")
      .insert(cambios.map((c) => ({ meta_id: id, campo: c.campo, valor_anterior: String(c.antes), valor_nuevo: String(c.despues), motivo: valores.motivo.slice(0, 500), quien: perfil.id })));
    if (errorCambios) console.error("[objetivos] cambios:", errorCambios.message);
  }
  updateTag("nichos");
  revalidatePath(RUTA, "layout");
  return { estado: "listo", mensaje: T.form.guardado, id };
}

export async function archivarMeta(datos: FormData) {
  const { supabase } = await exigirAdmin(RUTA);
  const id = texto(datos, "id");
  if (!uuidValido(id)) return;
  const { error } = await supabase.from("metas").update({ archivada: texto(datos, "volver") !== "si" }).eq("id", id);
  if (error) console.error("[objetivos] archivar:", error.message);
  updateTag("nichos");
  revalidatePath(RUTA, "layout");
}

// ── Plan inicial ──────────────────────────────────────────────────────
export async function cargarPlan(_previo: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const { supabase, perfil } = await exigirAdmin(`${RUTA}/plan`);
  const elegidas = new Set(datos.getAll("clave").map(String));
  const { data: existentes, error: errorLeer } = await supabase.from("metas").select("clave_plan").not("clave_plan", "is", null);
  if (errorLeer) return { estado: "error", mensaje: E.general };
  const cargadas = new Set((existentes ?? []).map((m) => m.clave_plan));
  const nuevas = PLAN_INICIAL.filter((m) => elegidas.has(m.clavePlan) && !cargadas.has(m.clavePlan)).map(completarDelPlan);
  if (nuevas.length === 0) return { estado: "error", mensaje: T.plan.nada };
  const { error } = await supabase.from("metas").insert(
    nuevas.map((m, i) => ({
      nombre: m.nombre,
      descripcion: m.descripcion ?? null,
      metrica: m.metrica,
      filtros: m.filtros,
      area: m.area,
      etapa: m.etapa,
      tipo_periodo: m.tipoPeriodo,
      desde: m.desde,
      hasta: m.hasta,
      meta_valor: m.meta,
      meta_original: m.meta,
      unidad: m.unidad,
      acumulacion: m.acumulacion,
      direccion: m.direccion,
      responsable: m.responsable,
      se_repite: m.seRepite,
      orden: (i + 1) * 10,
      clave_plan: m.clavePlan,
      creado_por: perfil.id,
    })),
  );
  if (error) {
    console.error("[objetivos] plan:", error.message);
    return { estado: "error", mensaje: E.general };
  }
  updateTag("nichos");
  revalidatePath(RUTA, "layout");
  return { estado: "listo", mensaje: T.plan.cargado.replace("{n}", String(nuevas.length)) };
}

// ── Desde el embudo: objetivos de actividad ───────────────────────────
export async function crearMetasDeActividad(datos: FormData) {
  const { supabase, perfil } = await exigirAdmin(RUTA);
  const id = texto(datos, "id");
  if (!uuidValido(id)) return;
  const meta = await cargarMeta(supabase, id);
  if (!meta || !tieneEmbudo(meta)) return;
  const hoy = hoyBA();
  const metas = await cargarMetas(supabase);
  const datosObj = await cargarDatos(supabase, desdeNecesario([meta, ...metas], hoy), hoy);
  const avance = calcularAvance(datosObj, meta, hoy);
  if (!avance.falta) return;
  const e = embudoAlReves(meta, avance.falta, tasasReales(datosObj, hoy, metas), abonoPromedio(datosObj, hoy));
  const desde = hoy > meta.desde ? hoy : meta.desde;
  const base = { etapa: meta.etapa, tipo_periodo: "rango", desde, hasta: meta.hasta, filtros: {}, se_repite: false, orden: meta.orden + 1, creado_por: perfil.id, descripcion: T.embudo.descripcion.replace("{nombre}", meta.nombre) };
  const nuevas = [
    { ...base, nombre: `${T.embudo.prefijo} ${METRICA.demos.nombre.toLowerCase()}`, metrica: "demos", area: "comercial", meta_valor: e.demos, meta_original: e.demos, unidad: "numero", acumulacion: "suma_del_periodo", direccion: "mas_es_mejor", responsable: "fabrizio" },
    { ...base, nombre: `${T.embudo.prefijo} ${METRICA.visitas_locales.nombre.toLowerCase()}`, metrica: "visitas_locales", area: "calle", meta_valor: e.visitasLocales, meta_original: e.visitasLocales, unidad: "numero", acumulacion: "suma_del_periodo", direccion: "mas_es_mejor", responsable: "los_dos" },
    { ...base, nombre: `${T.embudo.prefijo} ${METRICA.registros.nombre.toLowerCase()}`, metrica: "registros", area: "web", meta_valor: e.registros, meta_original: e.registros, unidad: "numero", acumulacion: "suma_del_periodo", direccion: "mas_es_mejor", responsable: "michel" },
  ];
  const { error } = await supabase.from("metas").insert(nuevas);
  if (error) console.error("[objetivos] actividad:", error.message);
  updateTag("nichos");
  revalidatePath(RUTA, "layout");
}

// ── Procesos a mano ───────────────────────────────────────────────────
export async function cerrarPeriodosAhora(): Promise<{ mensaje: string }> {
  const { supabase } = await exigirAdmin(RUTA);
  try {
    const r = await cerrarPeriodos(supabase);
    await fotografiar(supabase);
    updateTag("nichos");
    revalidatePath(RUTA, "layout");
    return { mensaje: r.cerrados === 0 ? T.procesos.nadaQueCerrar : T.procesos.cerrados.replace("{n}", String(r.cerrados)).replace("{c}", String(r.cumplidos)) };
  } catch (error) {
    console.error("[objetivos] cerrar:", error);
    return { mensaje: E.general };
  }
}
