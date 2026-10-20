import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { esNicho, esObjetivo } from "@/servidor/cuenta/validacion";
import type { Database, Tables } from "@/supabase/tipos";

/**
 * Los datos del panel. Siempre con el cliente del admin (RLS): si alguien
 * que no es admin llegara hasta acá, la base le devolvería vacío.
 */

type Cliente = SupabaseClient<Database>;
type Parametros = Record<string, string | string[] | undefined>;

const uno = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor) ?? "";
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// ── Filtros de los registrados (también los usa la exportación CSV) ───
export type Filtros = {
  nicho: string;
  objetivo: string;
  ciudad: string;
  desde: string;
  hasta: string;
  novedades: "" | "si" | "no";
};

export function leerFiltros(parametros: Parametros): Filtros {
  const nicho = uno(parametros.nicho);
  const objetivo = uno(parametros.objetivo);
  const novedades = uno(parametros.novedades);
  const desde = uno(parametros.desde);
  const hasta = uno(parametros.hasta);
  return {
    nicho: esNicho(nicho) ? nicho : "",
    objetivo: esObjetivo(objetivo) ? objetivo : "",
    ciudad: uno(parametros.ciudad).trim().slice(0, 80),
    desde: FECHA.test(desde) ? desde : "",
    hasta: FECHA.test(hasta) ? hasta : "",
    novedades: novedades === "si" || novedades === "no" ? novedades : "",
  };
}

/** Los mismos filtros, para armar links (exportar, limpiar). */
export function filtrosEnUrl(filtros: Filtros) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) if (valor) parametros.set(clave, valor);
  return parametros.toString();
}

/** Las fechas del filtro son días de Buenos Aires (UTC-3, sin horario de verano). */
const inicioDelDia = (dia: string) => `${dia}T00:00:00-03:00`;
const finDelDia = (dia: string) => new Date(new Date(inicioDelDia(dia)).getTime() + 86_400_000).toISOString();

export type Registro = Pick<
  Tables<"perfiles">,
  | "id"
  | "nombre"
  | "apellido"
  | "email"
  | "nicho_id"
  | "nicho_otro"
  | "objetivo_id"
  | "empresa"
  | "ciudad"
  | "telefono"
  | "acepta_novedades"
  | "origen"
  | "creado_en"
  | "email_confirmado_en"
>;

const COLUMNAS =
  "id, nombre, apellido, email, nicho_id, nicho_otro, objetivo_id, empresa, ciudad, telefono, acepta_novedades, origen, creado_en, email_confirmado_en";

function consultaRegistros(supabase: Cliente, filtros: Filtros) {
  let consulta = supabase.from("perfiles").select(COLUMNAS, { count: "exact" }).eq("rol", "usuario");
  if (filtros.nicho) consulta = consulta.eq("nicho_id", filtros.nicho);
  if (filtros.objetivo) consulta = consulta.eq("objetivo_id", filtros.objetivo);
  if (filtros.ciudad) consulta = consulta.ilike("ciudad", `%${filtros.ciudad.replace(/[%_\\]/g, "\\$&")}%`);
  if (filtros.desde) consulta = consulta.gte("creado_en", inicioDelDia(filtros.desde));
  if (filtros.hasta) consulta = consulta.lt("creado_en", finDelDia(filtros.hasta));
  if (filtros.novedades) consulta = consulta.eq("acepta_novedades", filtros.novedades === "si");
  return consulta.order("creado_en", { ascending: false });
}

export async function cargarRegistros(supabase: Cliente, filtros: Filtros, limite = 50) {
  const { data, count, error } = await consultaRegistros(supabase, filtros).range(0, limite - 1);
  if (error) throw new Error(`registros: ${error.message}`);
  return { filas: (data ?? []) as Registro[], total: count ?? 0 };
}

/** Todas las filas del filtro, de a mil (el tope de cada pedido a Supabase). */
export async function todosLosRegistros(supabase: Cliente, filtros: Filtros) {
  const filas: Registro[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await consultaRegistros(supabase, filtros).range(desde, desde + 999);
    if (error) throw new Error(`registros: ${error.message}`);
    filas.push(...((data ?? []) as Registro[]));
    if (!data || data.length < 1000) return filas;
  }
}

// ── Resumen ───────────────────────────────────────────────────────────
export type Resumen = {
  total: number;
  confirmados: number;
  hoy: number;
  semana: number;
  mes: number;
  por_nicho: Record<string, number>;
  por_objetivo: Record<string, number>;
  cruce: Array<{ nicho: string; objetivo: string; n: number }>;
};

export async function cargarResumen(supabase: Cliente): Promise<Resumen> {
  const { data, error } = await supabase.rpc("resumen_registros");
  if (error) throw new Error(`resumen: ${error.message}`);
  return data as unknown as Resumen;
}

// ── Visitas y registros ───────────────────────────────────────────────
export type PeriodoVisitas = "hoy" | "semana" | "mes";
export type Visitas = {
  /** Cuándo se midió la primera visita (null: todavía ninguna). */
  medido_desde: string | null;
  periodos: Record<PeriodoVisitas, { desde: string; personas: number; registros: number }>;
};

/** null si la base todavía no tiene la medición de visitas (migración sin aplicar). */
export async function cargarVisitas(supabase: Cliente): Promise<Visitas | null> {
  const { data, error } = await supabase.rpc("resumen_visitas");
  if (error) {
    console.error("[panel] visitas:", error.message);
    return null;
  }
  return data as unknown as Visitas;
}

// ── Rendimiento de plantillas ─────────────────────────────────────────
export const RANGOS = [7, 30, 90] as const;
export type Rango = (typeof RANGOS)[number];
export const leerRango = (parametros: Parametros): Rango => {
  const dias = Number(uno(parametros.rango));
  return (RANGOS as readonly number[]).includes(dias) ? (dias as Rango) : 30;
};

export type Metricas = {
  nicho_id: string | null;
  vistas: number;
  clics_demo: number;
  clics_contacto: number;
  inicios_registro: number;
  registros: number;
  confirmados: number;
};

export async function cargarMetricas(supabase: Cliente, dias: Rango): Promise<Metricas[]> {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data, error } = await supabase.rpc("metricas_nichos", { desde });
  if (error) throw new Error(`métricas: ${error.message}`);
  return (data ?? []).map((fila) => ({
    nicho_id: fila.nicho_id,
    vistas: Number(fila.vistas),
    clics_demo: Number(fila.clics_demo),
    clics_contacto: Number(fila.clics_contacto),
    inicios_registro: Number(fila.inicios_registro),
    registros: Number(fila.registros),
    confirmados: Number(fila.confirmados),
  }));
}

export type ClientePlantilla = Tables<"clientes_plantilla">;

export async function cargarClientes(supabase: Cliente): Promise<ClientePlantilla[]> {
  const { data, error } = await supabase
    .from("clientes_plantilla")
    .select("*")
    .order("fecha", { ascending: false })
    .order("creado_en", { ascending: false });
  if (error) throw new Error(`clientes: ${error.message}`);
  return data ?? [];
}

export async function cargarNichos(supabase: Cliente) {
  const { data, error } = await supabase.from("nichos").select("*").order("orden");
  if (error) throw new Error(`nichos: ${error.message}`);
  return data ?? [];
}
