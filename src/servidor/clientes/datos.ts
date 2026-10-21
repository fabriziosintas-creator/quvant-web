import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Constancia } from "@/clientes/clientes";
import type { Database, Tables } from "@/supabase/tipos";

/**
 * Los clientes reales: cada cuenta del sistema (clientes_sistema) con su
 * lado comercial (clientes_plantilla: abono y estado), su última salud y,
 * en la ficha, las constancias del permiso de métricas. Tolera que falten
 * migraciones: sin tablas devuelve null; sin la de permisos, historial null.
 */

type Cliente = SupabaseClient<Database>;
type Sistema = Tables<"clientes_sistema">;
type Plantilla = Tables<"clientes_plantilla">;

export type FilaCliente = {
  sistema: Sistema;
  plantilla: Plantilla | null;
  salud: number | null;
  semaforo: string | null;
};

export type ListaClientes = {
  filas: FilaCliente[];
  /** Clientes activos en Plantillas que todavía no tienen cuenta del sistema cargada. */
  sinCuenta: Plantilla[];
};

export async function cargarClientes(supabase: Cliente): Promise<ListaClientes | null> {
  const [sistema, plantillas] = await Promise.all([
    supabase.from("clientes_sistema").select("*").eq("es_prueba", false).order("nombre"),
    supabase.from("clientes_plantilla").select("*").eq("es_prueba", false),
  ]);
  if (sistema.error) return null;
  const filas = sistema.data ?? [];
  const ids = filas.map((c) => c.id);
  const { data: fotos } = ids.length
    ? await supabase.from("indicadores_diarios").select("cliente_id, dia, salud, semaforo").in("cliente_id", ids).order("dia", { ascending: false }).limit(ids.length * 3)
    : { data: [] };
  const ultima = new Map<string, { salud: number | null; semaforo: string | null }>();
  for (const f of fotos ?? []) if (!ultima.has(f.cliente_id)) ultima.set(f.cliente_id, { salud: f.salud, semaforo: f.semaforo });
  const porId = new Map((plantillas.data ?? []).map((p) => [p.id, p]));
  const enlazadas = new Set(filas.map((c) => c.cliente_plantilla_id).filter(Boolean));
  return {
    filas: filas.map((s) => ({ sistema: s, plantilla: s.cliente_plantilla_id ? (porId.get(s.cliente_plantilla_id) ?? null) : null, salud: ultima.get(s.id)?.salud ?? null, semaforo: ultima.get(s.id)?.semaforo ?? null })),
    sinCuenta: (plantillas.data ?? []).filter((p) => p.estado === "activo" && !enlazadas.has(p.id)).sort((a, b) => a.empresa.localeCompare(b.empresa)),
  };
}

export type FichaCliente = FilaCliente & {
  /** null: falta la migración de permisos. */
  historial: Constancia[] | null;
  oportunidadId: string | null;
};

export async function cargarFichaCliente(supabase: Cliente, id: string): Promise<FichaCliente | null> {
  const { data: s } = await supabase.from("clientes_sistema").select("*").eq("id", id).maybeSingle();
  if (!s) return null;
  const [plantilla, foto, permisos, oportunidad] = await Promise.all([
    s.cliente_plantilla_id ? supabase.from("clientes_plantilla").select("*").eq("id", s.cliente_plantilla_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("indicadores_diarios").select("salud, semaforo").eq("cliente_id", id).order("dia", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("permisos_metricas").select("accion, fecha, quien, medio, detalle, creado_en").eq("cliente_id", id).order("creado_en", { ascending: false }),
    s.cliente_plantilla_id ? supabase.from("oportunidades").select("id").eq("cliente_plantilla_id", s.cliente_plantilla_id).limit(1).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return {
    sistema: s,
    plantilla: plantilla.data,
    salud: foto.data?.salud ?? null,
    semaforo: foto.data?.semaforo ?? null,
    historial: permisos.error ? null : (permisos.data ?? []).map((p) => ({ accion: p.accion as Constancia["accion"], fecha: p.fecha, quien: p.quien, medio: p.medio, detalle: p.detalle, creadoEn: p.creado_en })),
    oportunidadId: oportunidad.data?.id ?? null,
  };
}
