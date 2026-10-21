import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ACCIONES, type Accion, type Entrada } from "@/bitacora/bitacora";
import type { Database, Json } from "@/supabase/tipos";

/**
 * Leer la bitácora (los admin; la base no deja editarla ni borrarla) y
 * anotar lo que no pasa por un trigger: exportaciones e ingresos.
 */

type Cliente = SupabaseClient<Database>;

export type FiltrosBitacora = { quien: string; tabla: string; accion: string; desde: string; hasta: string; registro: string; antes: number | null };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function leerFiltrosBitacora(p: Record<string, string | string[] | undefined>): FiltrosBitacora {
  const antes = Number(uno(p.antes));
  return {
    quien: /^[0-9a-f-]{36}$|^sistema$/.test(uno(p.quien)) ? uno(p.quien) : "",
    tabla: /^[a-z_]{1,60}$/.test(uno(p.tabla)) ? uno(p.tabla) : "",
    accion: (ACCIONES as readonly string[]).includes(uno(p.accion)) ? uno(p.accion) : "",
    desde: FECHA.test(uno(p.desde)) ? uno(p.desde) : "",
    hasta: FECHA.test(uno(p.hasta)) ? uno(p.hasta) : "",
    registro: uno(p.registro).trim().slice(0, 80),
    antes: Number.isInteger(antes) && antes > 0 ? antes : null,
  };
}

/** La misma búsqueda en la dirección (para paginar y exportar). */
export function filtrosEnUrl(f: FiltrosBitacora, extra: Record<string, string> = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ quien: f.quien, tabla: f.tabla, accion: f.accion, desde: f.desde, hasta: f.hasta, registro: f.registro, ...extra })) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : "";
}

type Fila = Database["public"]["Tables"]["bitacora"]["Row"];
const objeto = (v: Json | null) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
export const aEntrada = (f: Fila): Entrada => ({
  id: f.id,
  creadoEn: f.creado_en,
  quien: f.quien,
  sistema: f.sistema,
  tabla: f.tabla,
  registroId: f.registro_id,
  accion: f.accion as Accion,
  cambios: objeto(f.cambios),
  detalle: objeto(f.detalle),
  resumen: f.resumen,
});

/** Los nombres de quienes aparecen (los admin). */
export async function nombresDe(supabase: Cliente, ids: string[]): Promise<Record<string, string>> {
  const unicos = [...new Set(ids.filter(Boolean))];
  if (unicos.length === 0) return {};
  const { data } = await supabase.from("perfiles").select("id, nombre, apellido").in("id", unicos);
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.nombre]));
}

export const POR_PAGINA = 100;

/** La línea de tiempo con los filtros (null: falta la migración). */
export async function cargarBitacora(supabase: Cliente, f: FiltrosBitacora, limite = POR_PAGINA): Promise<{ entradas: Entrada[]; nombres: Record<string, string>; hayMas: boolean } | null> {
  let q = supabase.from("bitacora").select("*").order("id", { ascending: false }).limit(limite + 1);
  if (f.quien === "sistema") q = q.is("quien", null);
  else if (f.quien) q = q.eq("quien", f.quien);
  if (f.tabla) q = q.eq("tabla", f.tabla);
  if (f.accion) q = q.eq("accion", f.accion);
  if (f.desde) q = q.gte("creado_en", `${f.desde}T00:00:00-03:00`);
  if (f.hasta) q = q.lte("creado_en", `${f.hasta}T23:59:59.999-03:00`);
  if (f.registro) {
    const limpio = f.registro.replace(/[%,()*]/g, " ");
    q = /^[0-9a-f-]{36}$|^\d{4}-\d{2}-\d{2}$/.test(limpio) ? q.eq("registro_id", limpio) : q.ilike("resumen", `%${limpio}%`);
  }
  if (f.antes) q = q.lt("id", f.antes);
  const { data, error } = await q;
  if (error) return null;
  const filas = (data ?? []).slice(0, limite);
  return { entradas: filas.map(aEntrada), nombres: await nombresDe(supabase, filas.map((x) => x.quien ?? "")), hayMas: (data ?? []).length > limite };
}

/** El historial de un registro, para su ficha. */
export async function cargarHistorial(supabase: Cliente, tabla: string, registroId: string) {
  const { data, error } = await supabase.from("bitacora").select("*").eq("tabla", tabla).eq("registro_id", registroId).order("id", { ascending: false }).limit(50);
  if (error) return null;
  return { entradas: (data ?? []).map(aEntrada), nombres: await nombresDe(supabase, (data ?? []).map((x) => x.quien ?? "")) };
}

/** Qué se exportó y con qué filtro (nunca el contenido). Si falla, la exportación sigue igual. */
export async function anotarExportacion(supabase: Cliente, que: string, filtro: Record<string, string | null | undefined> = {}) {
  const limpio = Object.fromEntries(Object.entries(filtro).filter(([, v]) => v).map(([k, v]) => [k, String(v).slice(0, 100)]));
  const { error } = await supabase.rpc("anotar_en_bitacora", { p_accion: "exportacion", p_tabla: que, p_detalle: limpio });
  if (error && !/anotar_en_bitacora|schema cache/.test(error.message)) console.error("[bitácora] exportación:", error.message);
}
