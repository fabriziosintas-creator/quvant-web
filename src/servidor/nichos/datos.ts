import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { FUNCIONES_CLAVE, PLANTILLAS, type Plantilla } from "../../../medicion-sistema/catalogo";
import { embudoComercial, valorPonderado } from "@/comercial/comercial";
import type { DatosNicho, EmbudoWeb, Periodo, ResumenNicho, SocioNicho } from "@/nichos/tipos";
import { aActividad, aOportunidad } from "@/servidor/comercial/datos";
import { calcularAvance } from "@/objetivos/estado";
import { diaBA, limitesDelMes, sumarDias } from "@/objetivos/fechas";
import { conUnidad } from "@/objetivos/formato";
import { cargarDatos, cargarMetas, desdeNecesario } from "@/servidor/objetivos/datos";
import { cargarPanorama } from "@/servidor/nucleos/datos";
import { crearClienteAdmin } from "@/supabase/admin";
import type { Database } from "@/supabase/tipos";

/**
 * Los datos de "Dentro del nicho". Se leen con la clave secreta dentro de
 * una caché compartida ("use cache", etiqueta "nichos"): la página verifica
 * antes que quien pide es admin (exigirAdmin), y las acciones que cambian
 * datos invalidan la etiqueta (updateTag). Sin clave secreta, se lee sin
 * caché con la sesión del admin.
 *
 * Todo es tolerante: si falta una migración o una tabla, esa parte queda
 * vacía y se agrega un aviso para la pantalla.
 */

type Cliente = SupabaseClient<Database>;

export const ETIQUETA = "nichos";
export const PERIODOS: Periodo[] = [7, 30, 90, 0];

/** El período elegido y el anterior de igual largo (0 = desde siempre: desde el 1-ene-2026). */
export function periodoDe(dias: Periodo, hoy: string) {
  const desde = dias === 0 ? "2026-01-01" : sumarDias(hoy, -(dias - 1));
  const largo = dias === 0 ? 0 : dias;
  return {
    dias,
    desde,
    hasta: hoy,
    desdeAnterior: largo ? sumarDias(desde, -largo) : desde,
    hastaAnterior: largo ? sumarDias(desde, -1) : sumarDias(desde, -1),
  };
}

const comoEmbudo = (j: unknown): EmbudoWeb | null => {
  if (!j || typeof j !== "object") return null;
  const o = j as Record<string, number>;
  return { vistas: Number(o.vistas ?? 0), demos: Number(o.demos ?? 0), contacto: Number(o.contacto ?? 0), inicios: Number(o.inicios ?? 0), registros: Number(o.registros ?? 0), confirmados: Number(o.confirmados ?? 0) };
};

/** El MRR al cierre de cada mes, desde los clientes por plantilla con alta y baja. */
function mrrPorMes(clientes: Array<{ abono: number | null; alta: string | null; baja: string | null }>, hoy: string, meses = 12) {
  const serie: Array<{ mes: string; mrr: number }> = [];
  let cursor = limitesDelMes(hoy).desde;
  const lista: string[] = [];
  for (let i = 0; i < meses; i++) {
    lista.unshift(cursor);
    cursor = limitesDelMes(sumarDias(cursor, -1)).desde;
  }
  for (const inicio of lista) {
    const fin = limitesDelMes(inicio).hasta;
    const corte = fin < hoy ? fin : hoy;
    const mrr = clientes.filter((c) => c.alta !== null && c.alta <= corte && (c.baja === null || c.baja > corte)).reduce((s, c) => s + (c.abono ?? 0), 0);
    serie.push({ mes: inicio.slice(0, 7), mrr });
  }
  return serie;
}

async function armar(supabase: Cliente, nichoId: string, dias: Periodo, hoy: string): Promise<DatosNicho | null> {
  const avisos: string[] = [];
  const { data: nicho } = await supabase.from("nichos").select("id, nombre, tiene_plantilla, en_registro").eq("id", nichoId).maybeSingle();
  if (!nicho) return null;
  const p = periodoDe(dias, hoy);

  // ── Embudo web y atención ──
  const [actual, anterior, atencion] = await Promise.all([
    supabase.rpc("embudo_nicho", { nicho: nichoId, desde: p.desde, hasta: p.hasta }),
    supabase.rpc("embudo_nicho", { nicho: nichoId, desde: p.desdeAnterior, hasta: p.hastaAnterior }),
    supabase.rpc("atencion_nicho", { nicho: nichoId, desde: p.desde, hasta: p.hasta }),
  ]);
  if (actual.error) avisos.push("migracion_nichos");

  // ── Clientes por plantilla (abono, alta, baja) ──
  const { data: plantilla } = await supabase.from("clientes_plantilla").select("*").eq("nicho_id", nichoId).eq("es_prueba", false);
  const clientesPlantilla = (plantilla ?? []).map((c) => {
    const fila = c as typeof c & { fecha_alta?: string | null; fecha_baja?: string | null };
    // Antes de la migración de Objetivos no hay fecha de alta: se usa la fecha si está activo.
    const alta = fila.fecha_alta !== undefined ? fila.fecha_alta : c.estado === "activo" || c.estado === "baja" ? c.fecha : null;
    const baja = fila.fecha_baja !== undefined ? fila.fecha_baja : null;
    return { id: c.id, empresa: c.empresa, estado: c.estado, abono: c.abono_mensual === null ? null : Number(c.abono_mensual), alta, baja, localId: c.local_id };
  });
  if (plantilla && plantilla.length > 0 && !("fecha_alta" in plantilla[0])) avisos.push("migracion_objetivos");

  // ── Socios con uso (Núcleos: real o de ejemplo) ──
  const esPlantilla = (PLANTILLAS as readonly string[]).includes(nichoId);
  const panorama = await cargarPanorama(supabase, { rango: 30, responsable: "todos", incluirPrueba: false }, new Date(`${hoy}T15:00:00Z`));
  const { data: permisos } = await supabase.from("clientes_sistema").select("*");
  const comparte = new Map((permisos ?? []).map((f) => [f.id, Boolean((f as { comparte_metricas?: boolean }).comparte_metricas)]));
  const bajaSistema = new Map((permisos ?? []).map((f) => [f.id, (f as { baja?: string | null }).baja ?? null]));
  const conUso = panorama.clientes.filter((c) => c.nucleoId === nichoId);
  const enlazados = new Set((permisos ?? []).filter((f) => f.nucleo_id === nichoId && f.cliente_plantilla_id).map((f) => f.cliente_plantilla_id));
  const socios: SocioNicho[] = conUso.map((c) => {
    const i = c.indicadores;
    const semanas = (i?.semanas ?? []).slice(-12);
    const ventas = semanas.slice(-4).reduce((s, w) => s + (w.accionesPrincipales ?? 0), 0);
    const funciones = i?.funcionesClave ?? [];
    return {
      id: c.id,
      nombre: c.nombre,
      conUso: true,
      ejemplo: panorama.modoEjemplo,
      alta: c.alta,
      baja: bajaSistema.get(c.id) ?? null,
      abono: null,
      sucursales: c.sucursalesContratadas,
      plan: c.plan,
      responsable: c.responsable,
      salud: i?.salud ?? null,
      semaforo: i?.semaforo ?? "arranque",
      adopcion: i?.adopcion ?? null,
      semanas: semanas.map((w) => w.acciones),
      ventas4: i ? ventas : null,
      // En el modo de ejemplo todos "comparten" (son inventados); en serio, solo los que aceptaron.
      comparteMetricas: panorama.modoEjemplo ? true : (comparte.get(c.id) ?? false),
      crecimiento: i?.crecimiento?.total ?? null,
      funcionesUsadas: funciones.filter((f) => f.estado === "usada").map((f) => f.id),
      funcionesSinUsar: funciones.filter((f) => f.estado === "sin_usar").map((f) => f.id),
      dejoDeUsar: funciones.filter((f) => f.estado === "dejo_de_usar").map((f) => f.nombre),
      alertas: c.alertas.length,
      href: `/panel/nucleos/${c.nucleoId}/${c.id}`,
    };
  });
  // Los clientes de Plantillas que todavía no tienen uso medido en Núcleos.
  for (const c of clientesPlantilla) {
    if (enlazados.has(c.id) || (c.estado !== "activo" && c.estado !== "en_prueba" && c.estado !== "baja")) continue;
    socios.push({
      id: c.id,
      nombre: c.empresa,
      conUso: false,
      ejemplo: false,
      alta: c.alta,
      baja: c.baja,
      abono: c.abono,
      sucursales: 1,
      plan: null,
      responsable: null,
      salud: null,
      semaforo: "arranque",
      adopcion: null,
      semanas: [],
      ventas4: null,
      comparteMetricas: false,
      crecimiento: null,
      funcionesUsadas: [],
      funcionesSinUsar: [],
      dejoDeUsar: [],
      alertas: 0,
      href: null,
    });
  }
  if (panorama.modoEjemplo && conUso.length > 0) avisos.push("ejemplo");

  // ── Prospección del nicho ──
  const { data: locales } = await supabase.from("locales_resumen").select("*").eq("nicho_id", nichoId);
  const prospectos = (locales ?? [])
    .filter((l) => l.id && !l.es_prueba)
    .map((l) => ({
      id: l.id!,
      nombre: l.nombre ?? "",
      latitud: l.latitud,
      longitud: l.longitud,
      estado: l.estado ?? "por_visitar",
      volver: l.volver,
      visitas: l.cantidad_visitas ?? 0,
      ultimaVisita: l.ultima_visita,
      ultimoFeedback: l.ultimo_feedback,
      proxima: l.proxima_visita,
      ciudad: l.ciudad,
    }));
  const ids = prospectos.map((l) => l.id);
  const { data: visitasFilas } = ids.length
    ? await supabase.from("visitas").select("fecha, feedback, local_id").in("local_id", ids).eq("es_prueba", false).gte("fecha", p.desde)
    : { data: [] as Array<{ fecha: string; feedback: "bueno" | "regular" | "malo"; local_id: string }> };
  const lugar = new Map(prospectos.map((l) => [l.id, l]));
  const visitas = (visitasFilas ?? []).map((v) => ({ fecha: v.fecha, feedback: v.feedback, latitud: lugar.get(v.local_id)?.latitud ?? null, longitud: lugar.get(v.local_id)?.longitud ?? null }));

  // Tiempo hasta convertir: de la primera visita al local hasta el alta del cliente.
  const conLocal = clientesPlantilla.filter((c) => c.localId && c.alta);
  const { data: primeras } = conLocal.length
    ? await supabase.from("visitas").select("local_id, fecha").in("local_id", conLocal.map((c) => c.localId!)).order("fecha")
    : { data: [] as Array<{ local_id: string; fecha: string }> };
  const primera = new Map<string, string>();
  for (const v of primeras ?? []) if (!primera.has(v.local_id)) primera.set(v.local_id, v.fecha);
  const diasDesdeVisitaHastaAlta = conLocal.flatMap((c) => {
    const f = primera.get(c.localId!);
    if (!f || !c.alta || c.alta < f) return [];
    return [Math.round((Date.parse(c.alta) - Date.parse(f)) / 86_400_000)];
  });

  // ── Objetivos con filtro de este nicho ──
  let objetivos: DatosNicho["objetivos"] = [];
  try {
    const metas = (await cargarMetas(supabase)).filter((m) => m.filtros.nicho === nichoId);
    if (metas.length > 0) {
      const datos = await cargarDatos(supabase, desdeNecesario(metas, hoy), hoy);
      objetivos = metas.map((m) => {
        const a = calcularAvance(datos, m, hoy);
        return { id: m.id, nombre: m.nombre, avance: a.avance, estado: a.estado, valor: conUnidad(a.valor, m.unidad), meta: conUnidad(m.meta, m.unidad) };
      });
    }
  } catch {
    // Sin la migración de Objetivos: la sección se oculta.
  }

  // ── Seguimiento comercial del nicho ──
  let comercial: DatosNicho["comercial"] = null;
  const [{ data: ops, error: errorOps }, { data: acts }] = await Promise.all([
    supabase.from("oportunidades").select("*").eq("nicho_id", nichoId).eq("es_prueba", false),
    supabase.from("oportunidades_actividad").select("*").eq("es_prueba", false),
  ]);
  if (!errorOps && ops) {
    const oportunidades = ops.map(aOportunidad);
    const ids = new Set(oportunidades.map((o) => o.id));
    const actividades = (acts ?? []).filter((a) => ids.has(a.oportunidad_id)).map(aActividad);
    comercial = {
      pasos: embudoComercial(oportunidades, actividades).map((p) => ({ etapa: p.etapa, llegaron: p.llegaron })),
      ponderado: Math.round(valorPonderado(oportunidades)),
      abiertas: oportunidades.filter((o) => o.etapa !== "ganado" && o.etapa !== "perdido").length,
    };
  }

  return {
    nicho: { id: nicho.id, nombre: nicho.nombre, tienePlantilla: nicho.tiene_plantilla, enRegistro: nicho.en_registro },
    hoy,
    periodo: p,
    avisos,
    modoEjemplo: panorama.modoEjemplo && conUso.length > 0,
    embudo: { actual: comoEmbudo(actual.data), anterior: comoEmbudo(anterior.data) },
    atencion: (atencion.data ?? []).map((a) => ({ tipo: a.tipo, detalle: a.detalle, visitas: Number(a.visitas) })),
    socios,
    mrrMensual: mrrPorMes(clientesPlantilla, hoy),
    diasDesdeVisitaHastaAlta,
    prospectos,
    visitas,
    objetivos,
    funcionesClave: esPlantilla ? FUNCIONES_CLAVE[nichoId as Plantilla].map((f) => f.id) : [],
    comercial,
  };
}

/** La versión con caché compartida (clave secreta). La llama solo una página que ya verificó al admin. */
async function armarConCache(nichoId: string, dias: Periodo, hoy: string) {
  "use cache";
  cacheTag(ETIQUETA, `nicho:${nichoId}`);
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  return armar(crearClienteAdmin(), nichoId, dias, hoy);
}

export async function cargarNicho(supabaseDelAdmin: Cliente, nichoId: string, dias: Periodo): Promise<DatosNicho | null> {
  const hoy = diaBA(new Date());
  if (process.env.SUPABASE_SECRET_KEY) {
    try {
      return await armarConCache(nichoId, dias, hoy);
    } catch (error) {
      console.error("[nichos] caché:", error instanceof Error ? error.message : error);
    }
  }
  return armar(supabaseDelAdmin, nichoId, dias, hoy);
}

// ── La comparación entre nichos ───────────────────────────────────────
async function armarResumen(supabase: Cliente, hoy: string): Promise<ResumenNicho[]> {
  const desde = sumarDias(hoy, -29);
  const [{ data: nichos }, { data: metricas }, { data: clientes }, { data: locales }, panorama] = await Promise.all([
    supabase.from("nichos").select("id, nombre, tiene_plantilla, en_registro, orden").order("orden"),
    supabase.rpc("metricas_nichos", { desde: `${desde}T03:00:00Z` }),
    supabase.from("clientes_plantilla").select("*").eq("es_prueba", false),
    supabase.from("locales_resumen").select("nicho_id, cantidad_visitas, es_prueba"),
    cargarPanorama(supabase, { rango: 30, responsable: "todos", incluirPrueba: false }, new Date(`${hoy}T15:00:00Z`)),
  ]);
  return (nichos ?? [])
    .filter((n) => n.id !== "otro")
    .map((n) => {
      const m = (metricas ?? []).find((x) => x.nicho_id === n.id);
      const propios = (clientes ?? []).filter((c) => c.nicho_id === n.id);
      const altaDe = (c: (typeof propios)[number]) => (c as { fecha_alta?: string | null }).fecha_alta ?? (c.estado === "activo" ? c.fecha : null);
      const bajaDe = (c: (typeof propios)[number]) => (c as { fecha_baja?: string | null }).fecha_baja ?? null;
      const activos = propios.filter((c) => {
        const a = altaDe(c);
        const b = bajaDe(c);
        return a !== null && a <= hoy && (b === null || b > hoy) && c.estado !== "baja";
      });
      const alEmpezar = propios.filter((c) => {
        const a = altaDe(c);
        const b = bajaDe(c);
        return a !== null && a < desde && (b === null || b >= desde);
      }).length;
      const bajas = propios.filter((c) => {
        const b = bajaDe(c);
        return b !== null && b >= desde && b <= hoy;
      }).length;
      const conSalud = panorama.clientes.filter((c) => c.nucleoId === n.id && c.indicadores?.salud != null);
      const loc = (locales ?? []).filter((l) => l.nicho_id === n.id && !l.es_prueba);
      return {
        id: n.id,
        nombre: n.nombre,
        tienePlantilla: n.tiene_plantilla,
        socios: activos.length,
        mrr: activos.reduce((s, c) => s + Number(c.abono_mensual ?? 0), 0),
        saludPromedio: conSalud.length ? Math.round(conSalud.reduce((s, c) => s + (c.indicadores!.salud ?? 0), 0) / conSalud.length) : null,
        conversion: m && m.vistas > 0 && m.registros <= m.vistas ? m.registros / m.vistas : null,
        vistas: Number(m?.vistas ?? 0),
        registros: Number(m?.registros ?? 0),
        churn: alEmpezar > 0 ? bajas / alEmpezar : null,
        prospectos: loc.length,
        visitasLocales: loc.reduce((s, l) => s + (l.cantidad_visitas ?? 0), 0),
      };
    });
}

async function resumenConCache(hoy: string) {
  "use cache";
  cacheTag(ETIQUETA);
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  return armarResumen(crearClienteAdmin(), hoy);
}

export async function cargarResumenNichos(supabaseDelAdmin: Cliente): Promise<ResumenNicho[]> {
  const hoy = diaBA(new Date());
  if (process.env.SUPABASE_SECRET_KEY) {
    try {
      return await resumenConCache(hoy);
    } catch (error) {
      console.error("[nichos] caché del resumen:", error instanceof Error ? error.message : error);
    }
  }
  return armarResumen(supabaseDelAdmin, hoy);
}
