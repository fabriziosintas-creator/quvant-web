import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { diaBA, sumarDias } from "@/objetivos/fechas";
import type { DatosObjetivos, Dia, Filtros, Meta, Socio, TipoCobro } from "@/objetivos/tipos";
import type { Database, Tables } from "@/supabase/tipos";

/**
 * Los datos de la sección Objetivos, siempre con la sesión del admin (o
 * la clave secreta en el proceso diario): RLS manda. Lee todo lo que las
 * métricas necesitan y lo deja en la forma pura de src/objetivos.
 *
 * Los datos de prueba (es_prueba) no se leen salvo que se pidan.
 */

type Cliente = SupabaseClient<Database>;

/** Las tablas de Objetivos todavía no están en la base (falta aplicar la migración). */
export class FaltaMigracion extends Error {}

const faltaTabla = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === "42P01" || error.code === "PGRST205" || error.code === "PGRST202" || /does not exist|schema cache|Could not find/i.test(error.message ?? ""));

/** Lee todas las filas de a 1000 (el máximo que devuelve la API por vez). */
async function todas<T>(pagina: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { code?: string; message: string } | null }>, nombre: string): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await pagina(desde, desde + 999);
    if (error) {
      if (faltaTabla(error)) throw new FaltaMigracion(nombre);
      throw new Error(`${nombre}: ${error.message}`);
    }
    filas.push(...(data ?? []));
    if (!data || data.length < 1000) return filas;
  }
}

/** Fabrizio o Michel según el nombre del perfil admin (para "quién fue"). */
export const socioDe = (nombre: string | null | undefined): Socio | null => {
  const n = (nombre ?? "").trim().toLowerCase();
  if (n.startsWith("fabri")) return "fabrizio";
  if (n.startsWith("michel")) return "michel";
  return null;
};

export async function cargarDatos(supabase: Cliente, desde: Dia, hoy: Dia, conPrueba = false): Promise<DatosObjetivos> {
  const sinPrueba = <T extends { es_prueba?: boolean | null }>(filas: T[]) => (conPrueba ? filas : filas.filter((f) => !f.es_prueba));
  const desdeIso = `${sumarDias(desde, -1)}T00:00:00Z`;

  const [cobros, tipos, clientes, personas, visitantes, visitas, locales, admins, avances] = await Promise.all([
    todas((a, b) => supabase.from("cobros_quvant").select("fecha, tipo, monto_ars, nicho_id, cobrado, cliente, es_prueba").order("fecha").range(a, b), "cobros_quvant"),
    todas((a, b) => supabase.from("tipo_cambio_mensual").select("mes, pesos_por_dolar").range(a, b), "tipo_cambio_mensual"),
    todas((a, b) => supabase.from("clientes_plantilla").select("id, nicho_id, abono_mensual, fecha_alta, fecha_baja, es_prueba").range(a, b), "clientes_plantilla"),
    todas((a, b) => supabase.from("perfiles").select("creado_en, email_confirmado_en, nicho_id, objetivo_id").eq("rol", "usuario").range(a, b), "perfiles"),
    todas((a, b) => supabase.rpc("visitantes_por_dia", { desde, hasta: hoy }).range(a, b), "visitantes_por_dia"),
    todas((a, b) => supabase.from("visitas").select("fecha, visitante_id, feedback, local_id, es_prueba").gte("fecha", sumarDias(desde, -400)).range(a, b), "visitas"),
    todas((a, b) => supabase.from("locales").select("id, nicho_id, creado_en, es_prueba").range(a, b), "locales"),
    todas((a, b) => supabase.from("perfiles").select("id, nombre").eq("rol", "admin").range(a, b), "perfiles"),
    todas((a, b) => supabase.from("avances_manuales").select("meta_id, fecha, valor, es_prueba").range(a, b), "avances_manuales"),
  ]);

  // Núcleos puede no tener datos reales (modo ejemplo): sin tablas, sin fotos.
  const [nucleos, comercial] = await Promise.all([cargarNucleos(supabase, desdeIso, conPrueba), cargarComercialDeObjetivos(supabase, conPrueba)]);

  const nichoDelLocal = new Map(locales.map((l) => [l.id, l.nicho_id]));
  const socios = new Map(admins.map((a) => [a.id, socioDe(a.nombre)]));

  return {
    cobros: sinPrueba(cobros).map((c) => ({ fecha: c.fecha, tipo: c.tipo as TipoCobro, montoArs: Number(c.monto_ars), nicho: c.nicho_id, cobrado: c.cobrado, cliente: c.cliente })),
    tiposCambio: Object.fromEntries(tipos.map((t) => [t.mes.slice(0, 7), Number(t.pesos_por_dolar)])),
    clientes: sinPrueba(clientes).map((c) => ({ id: c.id, nicho: c.nicho_id, abono: c.abono_mensual === null ? null : Number(c.abono_mensual), alta: c.fecha_alta, baja: c.fecha_baja })),
    personas: personas.map((p) => ({ creado: diaBA(p.creado_en), confirmado: p.email_confirmado_en ? diaBA(p.email_confirmado_en) : null, nicho: p.nicho_id, objetivo: p.objetivo_id })),
    visitantes: visitantes.map((v) => ({ dia: v.dia, id: v.visita_id })),
    visitasLocales: sinPrueba(visitas).map((v) => ({ fecha: v.fecha, socio: socios.get(v.visitante_id) ?? null, nicho: nichoDelLocal.get(v.local_id) ?? null, feedback: v.feedback })),
    locales: sinPrueba(locales).map((l) => ({ creado: diaBA(l.creado_en), nicho: l.nicho_id })),
    saludClientes: nucleos.salud,
    alertas: nucleos.alertas,
    avances: sinPrueba(avances).map((a) => ({ metaId: a.meta_id, fecha: a.fecha, valor: Number(a.valor) })),
    comercial,
  };
}

/** El seguimiento comercial para las métricas (o null si todavía no está la tabla). */
async function cargarComercialDeObjetivos(supabase: Cliente, conPrueba: boolean): Promise<DatosObjetivos["comercial"]> {
  try {
    const [ops, acts] = await Promise.all([
      todas((a, b) => supabase.from("oportunidades").select("id, creado_en, etapa, valor_abono, valor_proyecto, probabilidad, nicho_id, etapa_desde, es_prueba").range(a, b), "oportunidades"),
      todas((a, b) => supabase.from("oportunidades_actividad").select("oportunidad_id, tipo, etapa_anterior, etapa_nueva, creado_en, es_prueba").range(a, b), "oportunidades_actividad"),
    ]);
    return {
      oportunidades: ops.filter((o) => conPrueba || !o.es_prueba).map((o) => ({ id: o.id, creadoEn: o.creado_en, etapa: o.etapa, valorAbono: o.valor_abono === null ? null : Number(o.valor_abono), valorProyecto: o.valor_proyecto === null ? null : Number(o.valor_proyecto), probabilidad: o.probabilidad, nicho: o.nicho_id, etapaDesde: o.etapa_desde })),
      actividades: acts.filter((a) => conPrueba || !a.es_prueba).map((a) => ({ oportunidadId: a.oportunidad_id, tipo: a.tipo as NonNullable<DatosObjetivos["comercial"]>["actividades"][number]["tipo"], etapaAnterior: a.etapa_anterior, etapaNueva: a.etapa_nueva, creadoEn: a.creado_en })),
    };
  } catch (error) {
    if (error instanceof FaltaMigracion) return null;
    throw error;
  }
}

/** Fotos de salud y alertas de Núcleos (sin tablas o sin datos: vacío). */
async function cargarNucleos(supabase: Cliente, desdeIso: string, conPrueba: boolean) {
  const vacio = { salud: [] as DatosObjetivos["saludClientes"], alertas: [] as DatosObjetivos["alertas"] };
  try {
    const crudo = supabase as unknown as SupabaseClient;
    const [clientes, fotos, alertas] = await Promise.all([
      todas<{ id: string; nucleo_id: string; es_prueba: boolean }>((a, b) => crudo.from("clientes_sistema").select("id, nucleo_id, es_prueba").range(a, b), "clientes_sistema"),
      todas<{ cliente_id: string; dia: string; datos: { salud?: number | null; semaforo?: string } }>((a, b) => crudo.from("indicadores_diarios").select("cliente_id, dia, datos").gte("dia", desdeIso.slice(0, 10)).range(a, b), "indicadores_diarios"),
      todas<{ cliente_id: string; fecha: string; estado: string }>((a, b) => crudo.from("alertas").select("cliente_id, fecha, estado").gte("fecha", desdeIso).range(a, b), "alertas"),
    ]);
    const nucleo = new Map(clientes.filter((c) => conPrueba || !c.es_prueba).map((c) => [c.id, c.nucleo_id]));
    return {
      salud: fotos.filter((f) => nucleo.has(f.cliente_id)).map((f) => ({ dia: f.dia, clienteId: f.cliente_id, nucleo: nucleo.get(f.cliente_id)!, salud: f.datos?.salud ?? null, semaforo: f.datos?.semaforo ?? "arranque" })),
      alertas: alertas.filter((a) => nucleo.has(a.cliente_id)).map((a) => ({ fecha: diaBA(a.fecha), resuelta: a.estado === "resuelta", nucleo: nucleo.get(a.cliente_id) ?? null })),
    };
  } catch (error) {
    if (error instanceof FaltaMigracion) return vacio;
    throw error;
  }
}

// ── Metas ─────────────────────────────────────────────────────────────
export type FilaMeta = Tables<"metas">;

export const aMeta = (f: FilaMeta): Meta => ({
  id: f.id,
  nombre: f.nombre,
  descripcion: f.descripcion,
  metrica: f.metrica,
  filtros: (f.filtros ?? {}) as Filtros,
  area: f.area as Meta["area"],
  etapa: f.etapa as Meta["etapa"],
  tipoPeriodo: f.tipo_periodo as Meta["tipoPeriodo"],
  desde: f.desde,
  hasta: f.hasta,
  meta: Number(f.meta_valor),
  metaOriginal: Number(f.meta_original),
  unidad: f.unidad as Meta["unidad"],
  direccion: f.direccion as Meta["direccion"],
  acumulacion: f.acumulacion as Meta["acumulacion"],
  responsable: f.responsable as Meta["responsable"],
  seRepite: f.se_repite,
  orden: f.orden,
  archivada: f.archivada,
  clavePlan: f.clave_plan,
  esPrueba: f.es_prueba,
});

export async function cargarMetas(supabase: Cliente, { archivadas = false, conPrueba = false } = {}): Promise<Meta[]> {
  const filas = await todas((a, b) => {
    let q = supabase.from("metas").select("*").order("orden").order("desde").order("nombre");
    if (!archivadas) q = q.eq("archivada", false);
    return q.range(a, b);
  }, "metas");
  return filas.filter((f) => conPrueba || !f.es_prueba).map(aMeta);
}

export async function cargarMeta(supabase: Cliente, id: string): Promise<Meta | null> {
  const { data, error } = await supabase.from("metas").select("*").eq("id", id).maybeSingle();
  if (error) {
    if (faltaTabla(error)) throw new FaltaMigracion("metas");
    throw new Error(`metas: ${error.message}`);
  }
  return data ? aMeta(data) : null;
}

export async function cargarCambios(supabase: Cliente, metaId: string) {
  return todas((a, b) => supabase.from("metas_cambios").select("*").eq("meta_id", metaId).order("creado_en", { ascending: false }).range(a, b), "metas_cambios");
}

export async function cargarCierres(supabase: Cliente, metaIds: string[]) {
  if (metaIds.length === 0) return [];
  return todas((a, b) => supabase.from("metas_cierres").select("*").in("meta_id", metaIds).order("hasta", { ascending: false }).range(a, b), "metas_cierres");
}

/** Los cierres de los últimos días (para el aviso "Cerró octubre: 8 de 11 cumplidos"). */
export async function cierresRecientes(supabase: Cliente, dias = 7) {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  return todas((a, b) => supabase.from("metas_cierres").select("meta_id, hasta, resultado, cerrado_en").gte("cerrado_en", desde).range(a, b), "metas_cierres");
}

export async function cargarAdminsConSocio(supabase: Cliente) {
  const filas = await todas((a, b) => supabase.from("perfiles").select("id, nombre, apellido").eq("rol", "admin").order("nombre").range(a, b), "perfiles");
  return filas.map((f) => ({ ...f, socio: socioDe(f.nombre) }));
}

/** La fecha más vieja que las metas necesitan (para no leer de más). */
export const desdeNecesario = (metas: Meta[], hoy: Dia) => metas.reduce((min, m) => (m.desde < min ? m.desde : min), sumarDias(hoy, -95));
