import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { IdBeneficio } from "@/datos/promo";

/**
 * Los datos de "Primeros 100" para el panel, siempre con la sesión del
 * admin (RLS: solo admin ve todos los lugares). Las tablas todavía no
 * están en los tipos generados hasta aplicar la migración: se consultan
 * sin tipos y se describen acá.
 */

export type EstadoLugar = "pedido" | "espera" | "reservado" | "coordinando" | "en_uso" | "usado" | "vencido" | "cancelado";
export const ESTADOS_LUGAR: readonly EstadoLugar[] = ["pedido", "espera", "reservado", "coordinando", "en_uso", "usado", "vencido", "cancelado"];
export const ESTADOS_EDITABLES: readonly EstadoLugar[] = ["reservado", "coordinando", "en_uso", "usado", "vencido", "cancelado"];
export const esEstadoLugar = (v: string): v is EstadoLugar => (ESTADOS_LUGAR as readonly string[]).includes(v);

export type LugarPanel = {
  id: string;
  numero: number | null;
  beneficio: IdBeneficio;
  estado: EstadoLugar;
  pedido_en: string;
  asignado_en: string | null;
  notas: string | null;
  es_prueba: boolean;
  perfil: {
    nombre: string;
    apellido: string | null;
    email: string;
    empresa: string | null;
    ciudad: string | null;
    telefono: string | null;
    nicho_id: string;
    nicho_otro: string | null;
    origen: string | null;
  } | null;
};

export type ConfigPromo = { activa: boolean; tope: number; hasta: string; rubros_sistema: string[] };

const sinTipos = (supabase: unknown) => supabase as SupabaseClient;

/** La configuración, o null si la base todavía no tiene la promo. */
export async function cargarConfigPromo(supabase: unknown): Promise<ConfigPromo | null> {
  const { data, error } = await sinTipos(supabase).from("promo_config").select("activa, tope, hasta, rubros_sistema").maybeSingle();
  if (error) {
    if (error.code !== "42P01" && error.code !== "PGRST205") console.error("[promo] config:", error.code, error.message);
    return null;
  }
  return data as ConfigPromo | null;
}

export async function cargarLugares(supabase: unknown): Promise<LugarPanel[]> {
  const { data, error } = await sinTipos(supabase)
    .from("promo_lugares")
    .select("id, numero, beneficio, estado, pedido_en, asignado_en, notas, es_prueba, perfil:perfiles(nombre, apellido, email, empresa, ciudad, telefono, nicho_id, nicho_otro, origen)")
    .order("numero", { ascending: true, nullsFirst: false })
    .order("pedido_en", { ascending: true });
  if (error) throw new Error(`lugares: ${error.message}`);
  return (data ?? []) as unknown as LugarPanel[];
}

/** Cuántas visitas del mapa dejaron la tarjeta con el QR de la promo. */
export async function contarTarjetas(supabase: unknown): Promise<number> {
  const { count, error } = await sinTipos(supabase).from("visitas").select("id", { count: "exact", head: true }).eq("tarjeta_promo", true);
  if (error) return 0;
  return count ?? 0;
}

export type PasoEmbudo = { tipo: string; visitas: number; total: number };

/** El embudo de la medición propia (security invoker: RLS de eventos, solo admin). */
export async function cargarEmbudo(supabase: unknown, dias = 30): Promise<PasoEmbudo[]> {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data, error } = await sinTipos(supabase).rpc("embudo_promo", { desde });
  if (error) {
    console.error("[promo] embudo:", error.code, error.message);
    return [];
  }
  return ((data ?? []) as Array<{ tipo: string; visitas: number | string; total: number | string }>).map((f) => ({
    tipo: f.tipo,
    visitas: Number(f.visitas),
    total: Number(f.total),
  }));
}

/** De dónde vino cada lugar: el origen del registro sin el prefijo de la promo ("primeros-100/visita" → "visita"). */
export const canalDe = (origen: string | null | undefined) => {
  if (!origen) return "directo";
  const [base, canal] = origen.split("/");
  return base === "primeros-100" ? canal || "página de la promo" : origen;
};
