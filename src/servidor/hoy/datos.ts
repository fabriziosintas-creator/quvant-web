import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { textoRitmo } from "@/componentes/panel/objetivos/Tarjeta";
import type { EntradaHoy } from "@/hoy/reglas";
import { calcularAvance } from "@/objetivos/estado";
import { diaBA, limitesDelMes, sumarDias } from "@/objetivos/fechas";
import { listarParaPanel } from "@/servidor/chat/servicio";
import { cargarComercialPuro } from "@/servidor/comercial/datos";
import { cargarPanorama } from "@/servidor/nucleos/datos";
import { cargarDatos, cargarMetas, desdeNecesario, FaltaMigracion } from "@/servidor/objetivos/datos";
import { crearClienteAdmin } from "@/supabase/admin";
import type { Database } from "@/supabase/tipos";

/**
 * Los datos de "Hoy", leídos una sola vez y en paralelo, reusando lo que ya
 * existe (Objetivos, Núcleos, el seguimiento comercial, el mapa y la
 * bandeja). La parte compartida va en caché ("use cache", etiqueta "hoy");
 * lo pospuesto es de cada admin y se aplica afuera.
 */

type Cliente = SupabaseClient<Database>;
export type BaseHoy = Omit<EntradaHoy, "pospuestas"> & {
  numeros: { registros: [number, number]; visitasWeb: [number, number]; visitasLocales: [number, number]; cobradoMes: number };
};

async function armar(supabase: Cliente, ahora: string): Promise<BaseHoy> {
  const hoy = diaBA(ahora);
  const ayer = sumarDias(hoy, -1);
  const mes = hoy.slice(0, 7);
  const { desde: inicioMes, hasta: finMes } = limitesDelMes(hoy);

  const [comercial, locales, panorama, charlas, cobros, clientes, tipoCambio, perfiles, visitantes, visitasLocales] = await Promise.all([
    cargarComercialPuro(supabase).catch(() => null),
    supabase.from("locales_resumen").select("id, nombre, proxima_visita, estado, volver, latitud, longitud, es_prueba"),
    cargarPanorama(supabase, { rango: 30, responsable: "todos", incluirPrueba: false }, new Date(ahora)).catch(() => null),
    listarParaPanel().catch(() => []),
    supabase.from("cobros_quvant").select("id, cliente, monto_ars, cobrado, tipo, cliente_plantilla_id, fecha").gte("fecha", inicioMes).lte("fecha", finMes).eq("es_prueba", false),
    supabase.from("clientes_plantilla").select("*").eq("es_prueba", false),
    supabase.from("tipo_cambio_mensual").select("mes").eq("mes", inicioMes).maybeSingle(),
    supabase.from("perfiles").select("creado_en").eq("rol", "usuario").gte("creado_en", `${ayer}T03:00:00Z`),
    supabase.rpc("visitantes_por_dia", { desde: ayer, hasta: hoy }),
    supabase.from("visitas").select("fecha").gte("fecha", ayer).eq("es_prueba", false),
  ]);

  // Objetivos: los que están en riesgo o atrasados, con su línea de ritmo.
  let objetivos: EntradaHoy["objetivos"] = [];
  try {
    const metas = (await cargarMetas(supabase)).filter((m) => m.desde <= hoy && hoy <= m.hasta);
    if (metas.length) {
      const datos = await cargarDatos(supabase, desdeNecesario(metas, hoy), hoy);
      objetivos = metas.map((m) => {
        const a = calcularAvance(datos, m, hoy);
        return { id: m.id, nombre: m.nombre, estado: a.estado, ritmo: textoRitmo(m, a, hoy) };
      });
    }
  } catch (error) {
    if (!(error instanceof FaltaMigracion)) throw error;
  }

  const filasCobros = cobros.data ?? [];
  const abonosCobrados = new Set(filasCobros.filter((c) => c.tipo === "abono_mensual").flatMap((c) => [c.cliente_plantilla_id, c.cliente.trim().toLowerCase()]));
  const activos = (clientes.data ?? []).filter((c) => c.estado === "activo" && Number(c.abono_mensual ?? 0) > 0);
  const contar = <T,>(filas: T[] | null, dia: (f: T) => string) => [(filas ?? []).filter((f) => dia(f) === hoy).length, (filas ?? []).filter((f) => dia(f) === ayer).length] as [number, number];

  return {
    ahora,
    hoy,
    mes,
    oportunidades: comercial
      ? comercial.filas.map((f) => ({ id: f.id, negocio: f.negocio, etapa: f.etapa, creadoEn: f.creado_en, telefono: f.telefono, proximoPaso: f.proximo_paso, proximoFecha: f.proximo_paso_fecha }))
      : null,
    actividades: comercial?.actividades ?? [],
    locales: (locales.data ?? [])
      .filter((l) => l.id && !l.es_prueba)
      .map((l) => ({ id: l.id!, nombre: l.nombre ?? "", proxima: l.proxima_visita, caliente: l.estado === "interesado" || l.volver === "si", latitud: l.latitud, longitud: l.longitud })),
    objetivos,
    socios: (panorama?.clientes ?? []).map((c) => ({ id: c.id, nombre: c.nombre, semaforo: c.indicadores?.semaforo ?? "arranque", alertasNuevas: c.alertas.filter((a) => a.estado === "nueva").length, href: `/panel/nucleos/${c.nucleoId}/${c.id}` })),
    sociosDeEjemplo: panorama?.modoEjemplo ?? true,
    charlas: charlas.filter((c) => c.estado !== "cerrada").map((c) => ({ id: c.id, nombre: c.pedido?.nombre ?? `Visitante ${c.id.slice(0, 4).toUpperCase()}`, espera: c.estado === "espera-humano", noLeidos: c.noLeidos })),
    cobrosPendientes: filasCobros.filter((c) => !c.cobrado).map((c) => ({ id: c.id, cliente: c.cliente, monto: Number(c.monto_ars) })),
    abonosSinCargar: activos.filter((c) => !abonosCobrados.has(c.id) && !abonosCobrados.has(c.empresa.trim().toLowerCase())).map((c) => ({ id: c.id, empresa: c.empresa })),
    hayTipoCambio: Boolean(tipoCambio.data) || Boolean(tipoCambio.error),
    numeros: {
      registros: contar(perfiles.data, (f) => diaBA(f.creado_en)),
      visitasWeb: [new Set((visitantes.data ?? []).filter((v) => v.dia === hoy).map((v) => v.visita_id)).size, new Set((visitantes.data ?? []).filter((v) => v.dia === ayer).map((v) => v.visita_id)).size],
      visitasLocales: contar(visitasLocales.data, (f) => f.fecha),
      cobradoMes: filasCobros.filter((c) => c.cobrado).reduce((s, c) => s + Number(c.monto_ars), 0),
    },
  };
}

/** La parte compartida, en caché (se vence con updateTag("hoy") en las acciones y cada 5 minutos). */
async function armarConCache(minuto: string) {
  "use cache";
  cacheTag("hoy", "nichos");
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 });
  return armar(crearClienteAdmin(), minuto);
}

export async function cargarHoy(supabaseDelAdmin: Cliente, perfilId: string): Promise<EntradaHoy & Pick<BaseHoy, "numeros">> {
  // La clave de caché cambia cada 5 minutos (el "ahora" de las reglas de horas hábiles).
  const ahora = new Date(Math.floor(Date.now() / 300_000) * 300_000).toISOString();
  let base: BaseHoy;
  if (process.env.SUPABASE_SECRET_KEY) {
    try {
      base = await armarConCache(ahora);
    } catch (error) {
      console.error("[hoy] caché:", error instanceof Error ? error.message : error);
      base = await armar(supabaseDelAdmin, ahora);
    }
  } else base = await armar(supabaseDelAdmin, ahora);

  const { data: pospuestas } = await supabaseDelAdmin.from("hoy_pospuestas").select("clave").eq("perfil_id", perfilId).gte("hasta", base.hoy);
  return { ...base, pospuestas: new Set((pospuestas ?? []).map((p) => p.clave)) };
}
