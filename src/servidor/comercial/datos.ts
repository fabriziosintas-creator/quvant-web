import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Actividad, Etapa, Oportunidad, TipoActividad } from "@/comercial/comercial";
import { FaltaMigracion } from "@/servidor/objetivos/datos";
import type { Database, Tables } from "@/supabase/tipos";

/**
 * Los datos del seguimiento comercial, con la sesión del admin (RLS). Si
 * la tabla todavía no existe (migración sin aplicar), FaltaMigracion.
 */

type Cliente = SupabaseClient<Database>;
export type FilaOportunidad = Tables<"oportunidades">;

const falta = (e: { code?: string; message?: string } | null) => !!e && (e.code === "42P01" || e.code === "PGRST205" || /does not exist|schema cache|Could not find/i.test(e.message ?? ""));

export const aOportunidad = (f: FilaOportunidad): Oportunidad => ({
  id: f.id,
  etapa: f.etapa as Etapa,
  valorAbono: f.valor_abono === null ? null : Number(f.valor_abono),
  valorProyecto: f.valor_proyecto === null ? null : Number(f.valor_proyecto),
  probabilidad: f.probabilidad,
  etapaDesde: f.etapa_desde,
  creadoEn: f.creado_en,
  nicho: f.nicho_id,
});

export const aActividad = (f: Tables<"oportunidades_actividad">): Actividad => ({
  oportunidadId: f.oportunidad_id,
  tipo: f.tipo as TipoActividad,
  etapaAnterior: f.etapa_anterior,
  etapaNueva: f.etapa_nueva,
  creadoEn: f.creado_en,
});

async function todas<T>(pagina: (a: number, b: number) => PromiseLike<{ data: T[] | null; error: { code?: string; message: string } | null }>): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await pagina(desde, desde + 999);
    if (error) {
      if (falta(error)) throw new FaltaMigracion("oportunidades");
      throw new Error(`comercial: ${error.message}`);
    }
    filas.push(...(data ?? []));
    if (!data || data.length < 1000) return filas;
  }
}

export async function cargarComercial(supabase: Cliente, conPrueba = false) {
  const [filas, actividades] = await Promise.all([
    todas((a, b) => supabase.from("oportunidades").select("*").order("actualizado_en", { ascending: false }).range(a, b)),
    todas((a, b) => supabase.from("oportunidades_actividad").select("*").order("creado_en").range(a, b)),
  ]);
  const ops = filas.filter((f) => conPrueba || !f.es_prueba);
  const ids = new Set(ops.map((o) => o.id));
  return { filas: ops, actividades: actividades.filter((a) => ids.has(a.oportunidad_id)) };
}

export async function cargarOportunidad(supabase: Cliente, id: string) {
  const { data, error } = await supabase.from("oportunidades").select("*").eq("id", id).maybeSingle();
  if (error) {
    if (falta(error)) throw new FaltaMigracion("oportunidades");
    throw new Error(`oportunidad: ${error.message}`);
  }
  if (!data) return null;
  const { data: actividades } = await supabase.from("oportunidades_actividad").select("*").eq("oportunidad_id", id).order("creado_en", { ascending: false });
  return { fila: data, actividades: actividades ?? [] };
}

/** Para Objetivos y Dentro del nicho: oportunidades y actividad en forma pura, o null si falta la tabla. */
export async function cargarComercialPuro(supabase: Cliente): Promise<{ oportunidades: Oportunidad[]; actividades: Actividad[]; filas: FilaOportunidad[] } | null> {
  try {
    const { filas, actividades } = await cargarComercial(supabase);
    return { oportunidades: filas.map(aOportunidad), actividades: actividades.map(aActividad), filas };
  } catch (error) {
    if (error instanceof FaltaMigracion) return null;
    throw error;
  }
}
