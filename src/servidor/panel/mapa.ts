import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { esNicho, uuidValido } from "@/servidor/cuenta/validacion";
import type { Database, Enums, Tables } from "@/supabase/tipos";

/**
 * Los datos del mapa de prospección (6.3): los locales con sus visitas
 * contadas (vista locales_resumen), el historial de visitas y quiénes
 * pueden salir a visitar (los admin). Siempre con el cliente del admin:
 * la base (RLS) no le da nada a nadie más.
 */

type Cliente = SupabaseClient<Database>;
type Parametros = Record<string, string | string[] | undefined>;
const uno = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor) ?? "";

export const ESTADOS_LOCAL = ["por_visitar", "visitado", "interesado", "cliente", "descartado"] as const;
export const FEEDBACKS = ["bueno", "regular", "malo"] as const;
export const VOLVER = ["si", "mas_adelante", "no"] as const;
export type EstadoLocal = Enums<"estado_local">;
export type Feedback = Enums<"feedback">;
export type Volver = Enums<"volver">;
export const esEstadoLocal = (v: string): v is EstadoLocal => (ESTADOS_LOCAL as readonly string[]).includes(v);
export const esFeedback = (v: string): v is Feedback => (FEEDBACKS as readonly string[]).includes(v);
export const esVolver = (v: string): v is Volver => (VOLVER as readonly string[]).includes(v);

/** Un local con lo que la vista le suma: visitas contadas y la última. */
export type Local = {
  id: string;
  nombre: string;
  nicho_id: string | null;
  rubro: string | null;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  latitud: number | null;
  longitud: number | null;
  place_id: string | null;
  telefono: string | null;
  contacto: string | null;
  web: string | null;
  estado: EstadoLocal;
  volver: Volver | null;
  proxima_visita: string | null;
  origen: Enums<"origen_local">;
  es_prueba: boolean;
  creado_en: string;
  cantidad_visitas: number;
  ultima_visita: string | null;
  ultimo_feedback: Feedback | null;
  ultimo_visitante_id: string | null;
};

export type Visita = Pick<
  Tables<"visitas">,
  "id" | "local_id" | "fecha" | "visitante_id" | "feedback" | "volver" | "nota" | "siguiente_paso" | "es_prueba" | "creado_en"
> & {
  /** Si se dejó la tarjeta de "Primeros 100" (columna de la migración de la promo). */
  tarjeta_promo?: boolean;
};

export type Admin = { id: string; nombre: string; apellido: string | null };

export async function cargarLocales(supabase: Cliente): Promise<Local[]> {
  const { data, error } = await supabase.from("locales_resumen").select("*").order("nombre");
  if (error) throw new Error(`locales: ${error.message}`);
  return (data ?? []).flatMap((fila) =>
    fila.id && fila.nombre && fila.estado && fila.origen && fila.creado_en
      ? [
          {
            id: fila.id,
            nombre: fila.nombre,
            nicho_id: fila.nicho_id,
            rubro: fila.rubro,
            direccion: fila.direccion,
            ciudad: fila.ciudad,
            provincia: fila.provincia,
            latitud: fila.latitud,
            longitud: fila.longitud,
            place_id: fila.place_id,
            telefono: fila.telefono,
            contacto: fila.contacto,
            web: fila.web,
            estado: fila.estado,
            volver: fila.volver,
            proxima_visita: fila.proxima_visita,
            origen: fila.origen,
            es_prueba: fila.es_prueba ?? false,
            creado_en: fila.creado_en,
            cantidad_visitas: fila.cantidad_visitas ?? 0,
            ultima_visita: fila.ultima_visita,
            ultimo_feedback: fila.ultimo_feedback,
            ultimo_visitante_id: fila.ultimo_visitante_id,
          },
        ]
      : [],
  );
}

/** Las visitas, agrupadas por local y de la más nueva a la más vieja. */
export async function cargarVisitas(supabase: Cliente): Promise<Record<string, Visita[]>> {
  const { data, error } = await supabase
    .from("visitas")
    // Todas las columnas: tarjeta_promo existe recién con la migración de la promo.
    .select("*")
    .order("fecha", { ascending: false })
    .order("creado_en", { ascending: false })
    .limit(5000);
  if (error) throw new Error(`visitas: ${error.message}`);
  const porLocal: Record<string, Visita[]> = {};
  for (const visita of data ?? []) (porLocal[visita.local_id] ??= []).push(visita);
  return porLocal;
}

/** Quiénes salen a visitar: los admin (fabrizio y Michel). */
export async function cargarAdmins(supabase: Cliente): Promise<Admin[]> {
  const { data, error } = await supabase.from("perfiles").select("id, nombre, apellido").eq("rol", "admin").order("nombre");
  if (error) throw new Error(`admins: ${error.message}`);
  return data ?? [];
}

// ── Filtros (en la dirección, como en el resumen) ─────────────────────
export type FiltrosMapa = {
  nicho: string;
  estado: EstadoLocal | "";
  feedback: Feedback | "";
  volver: Volver | "";
  visitante: string;
  /** Días sin visitar (0 = sin filtro). */
  sinVisitar: number;
  /** Solo los que tienen próxima visita en los próximos 7 días. */
  semana: boolean;
};

export function leerFiltrosMapa(parametros: Parametros): FiltrosMapa {
  const nicho = uno(parametros.nicho);
  const estado = uno(parametros.estado);
  const feedback = uno(parametros.feedback);
  const volver = uno(parametros.volver);
  const visitante = uno(parametros.visitante);
  const dias = Number.parseInt(uno(parametros.sinVisitar), 10);
  return {
    nicho: esNicho(nicho) ? nicho : "",
    estado: esEstadoLocal(estado) ? estado : "",
    feedback: esFeedback(feedback) ? feedback : "",
    volver: esVolver(volver) ? volver : "",
    visitante: uuidValido(visitante) ? visitante : "",
    sinVisitar: Number.isFinite(dias) && dias > 0 ? Math.min(dias, 3650) : 0,
    semana: uno(parametros.semana) === "si",
  };
}

export function filtrosMapaEnUrl(filtros: FiltrosMapa) {
  const parametros = new URLSearchParams();
  if (filtros.nicho) parametros.set("nicho", filtros.nicho);
  if (filtros.estado) parametros.set("estado", filtros.estado);
  if (filtros.feedback) parametros.set("feedback", filtros.feedback);
  if (filtros.volver) parametros.set("volver", filtros.volver);
  if (filtros.visitante) parametros.set("visitante", filtros.visitante);
  if (filtros.sinVisitar) parametros.set("sinVisitar", String(filtros.sinVisitar));
  if (filtros.semana) parametros.set("semana", "si");
  return parametros.toString();
}

export const hayFiltros = (f: FiltrosMapa) => Boolean(f.nicho || f.estado || f.feedback || f.volver || f.visitante || f.sinVisitar || f.semana);

/** Un día "AAAA-MM-DD" más n días. */
const masDias = (dia: string, n: number) => new Date(new Date(`${dia}T00:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);

export function filtrarLocales(locales: Local[], visitas: Record<string, Visita[]>, filtros: FiltrosMapa, hoy: string): Local[] {
  const limiteSinVisitar = filtros.sinVisitar ? masDias(hoy, -filtros.sinVisitar) : null;
  const finDeSemana = masDias(hoy, 7);
  return locales.filter((l) => {
    if (filtros.nicho && l.nicho_id !== filtros.nicho) return false;
    if (filtros.estado && l.estado !== filtros.estado) return false;
    if (filtros.feedback && l.ultimo_feedback !== filtros.feedback) return false;
    if (filtros.volver && l.volver !== filtros.volver) return false;
    if (filtros.visitante && !(visitas[l.id] ?? []).some((v) => v.visitante_id === filtros.visitante)) return false;
    if (limiteSinVisitar && l.ultima_visita && l.ultima_visita > limiteSinVisitar) return false;
    if (filtros.semana && !(l.proxima_visita && l.proxima_visita >= hoy && l.proxima_visita <= finDeSemana)) return false;
    return true;
  });
}

// ── Contadores de arriba ──────────────────────────────────────────────
export type Contadores = {
  locales: number;
  visitados: number;
  interesados: number;
  clientes: number;
  descartados: number;
  /** Visitas de este mes, por socio (nombre → cantidad). */
  visitasMes: Array<{ nombre: string; cantidad: number }>;
};

export function contar(locales: Local[], visitas: Record<string, Visita[]>, admins: Admin[], hoy: string): Contadores {
  const mes = hoy.slice(0, 7);
  const porSocio = new Map<string, number>();
  for (const lista of Object.values(visitas)) {
    for (const v of lista) if (v.fecha.startsWith(mes)) porSocio.set(v.visitante_id, (porSocio.get(v.visitante_id) ?? 0) + 1);
  }
  return {
    locales: locales.length,
    visitados: locales.filter((l) => l.cantidad_visitas > 0).length,
    interesados: locales.filter((l) => l.estado === "interesado").length,
    clientes: locales.filter((l) => l.estado === "cliente").length,
    descartados: locales.filter((l) => l.estado === "descartado").length,
    visitasMes: admins
      .map((a) => ({ nombre: a.nombre, cantidad: porSocio.get(a.id) ?? 0 }))
      .sort((a, b) => b.cantidad - a.cantidad),
  };
}
