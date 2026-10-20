import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PLANTILLAS, type Plantilla } from "../../../medicion-sistema/catalogo";
import { SEMAFORO_ANTERIOR_EJEMPLO, acompanamientosDeEjemplo, clientesDeEjemplo, usoDeEjemplo } from "@/nucleos/ejemplo";
import { calcularIndicadores, generarAlertas, pasoActivacion } from "@/nucleos/indicadores";
import type { Acompanamiento, Alerta, ClienteSistema, Indicadores, PasoActivacion, Responsable } from "@/nucleos/tipos";
import type { Database } from "@/supabase/tipos";
import { posthogConfigurado } from "./posthog";

/**
 * Lo que ve la sección Núcleos. Dos modos:
 *  · real: clientes_sistema + la última foto de indicadores_diarios +
 *    alertas y acompañamientos de Supabase (con la sesión del admin: RLS);
 *  · ejemplo: cuando falta PostHog, faltan las tablas o no hay clientes
 *    reales. Clientes y uso inventados (src/nucleos/ejemplo.ts), calculados
 *    al vuelo, marcados prueba y con cartel en pantalla. Se apaga solo.
 */

// Las tablas de Núcleos todavía no están en los tipos generados (la migración no se aplicó): se consultan sin tipos y se tipan a mano.
type Cliente = SupabaseClient<Database>;
const crudo = (supabase: Cliente) => supabase as unknown as SupabaseClient;

export const RANGOS = [7, 30, 90] as const;
export type Rango = (typeof RANGOS)[number];

export type Filtros = { rango: Rango; responsable: Responsable | "todos"; incluirPrueba: boolean };

export function leerFiltrosNucleos(parametros: Record<string, string | string[] | undefined>): Filtros {
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const rango = Number(uno(parametros.rango));
  const responsable = uno(parametros.responsable);
  return {
    rango: (RANGOS as readonly number[]).includes(rango) ? (rango as Rango) : 30,
    responsable: responsable === "fabrizio" || responsable === "michel" ? responsable : "todos",
    incluirPrueba: uno(parametros.prueba) === "1",
  };
}

export function filtrosEnUrl(filtros: Filtros) {
  const p = new URLSearchParams();
  if (filtros.rango !== 30) p.set("rango", String(filtros.rango));
  if (filtros.responsable !== "todos") p.set("responsable", filtros.responsable);
  if (filtros.incluirPrueba) p.set("prueba", "1");
  const s = p.toString();
  return s ? `?${s}` : "";
}

export type Nucleo = { id: string; nombre: string; plantilla: Plantilla | null; estado: "activo" | "proximamente"; orden: number };

export type ClienteConIndicadores = ClienteSistema & {
  indicadores: Indicadores | null;
  paso: PasoActivacion | null;
  alertas: Alerta[];
};

export type Panorama = {
  modoEjemplo: boolean;
  /** Por qué está en modo ejemplo (para el cartel). */
  motivoEjemplo: string | null;
  nucleos: Nucleo[];
  clientes: ClienteConIndicadores[];
  acompanamientos: Acompanamiento[];
  filtros: Filtros;
};

const NUCLEOS_FIJOS: Nucleo[] = [
  { id: "industria", nombre: "Industria y comercio", plantilla: "industria", estado: "activo", orden: 1 },
  { id: "gimnasios", nombre: "Gimnasios y fitness", plantilla: "gimnasios", estado: "activo", orden: 2 },
  { id: "holistica", nombre: "Holística", plantilla: "holistica", estado: "activo", orden: 3 },
  { id: "kioscos", nombre: "Kioscos", plantilla: "kioscos", estado: "proximamente", orden: 4 },
  { id: "pymes", nombre: "Pymes", plantilla: "pymes", estado: "proximamente", orden: 5 },
  { id: "inmobiliarias", nombre: "Inmobiliarias", plantilla: "inmobiliarias", estado: "proximamente", orden: 6 },
  { id: "supermercados", nombre: "Supermercados", plantilla: "supermercados", estado: "proximamente", orden: 7 },
];

const esPlantilla = (v: unknown): v is Plantilla => typeof v === "string" && (PLANTILLAS as readonly string[]).includes(v);

type FilaCliente = {
  id: string; organizacion_id: string; nombre: string; nucleo_id: string; alta: string; plan: "negocio" | "multinegocio" | null;
  sucursales_contratadas: number; usuarios_contratados: number; responsable: Responsable; modulos_activos: string[] | null; es_prueba: boolean;
};

const aCliente = (f: FilaCliente, nucleos: Nucleo[]): ClienteSistema => ({
  id: f.id,
  organizacionId: f.organizacion_id,
  nombre: f.nombre,
  nucleoId: f.nucleo_id,
  plantilla: (() => {
    const p = nucleos.find((n) => n.id === f.nucleo_id)?.plantilla;
    return esPlantilla(p) ? p : esPlantilla(f.nucleo_id) ? f.nucleo_id : "industria";
  })(),
  alta: f.alta,
  plan: f.plan,
  sucursalesContratadas: f.sucursales_contratadas,
  usuariosContratados: f.usuarios_contratados,
  responsable: f.responsable,
  modulosActivos: f.modulos_activos ?? [],
  esPrueba: f.es_prueba,
});

type FilaAlerta = { id: string; cliente_id: string; tipo: Alerta["tipo"]; funcion_clave: string | null; gravedad: "roja" | "amarilla"; fecha: string; estado: Alerta["estado"]; detalle: Record<string, string | number>; resolucion: string | null; es_prueba: boolean };
const aAlerta = (f: FilaAlerta): Alerta => ({ id: f.id, clienteId: f.cliente_id, tipo: f.tipo, funcionClave: f.funcion_clave, gravedad: f.gravedad, fecha: f.fecha, estado: f.estado, detalle: f.detalle ?? {}, resolucion: f.resolucion, esPrueba: f.es_prueba });

type FilaAcomp = { id: string; cliente_id: string; fecha: string; quien: string | null; tipo: Acompanamiento["tipo"]; nota: string | null; alerta_id: string | null; es_prueba: boolean };
const aAcomp = (f: FilaAcomp): Acompanamiento => ({ id: f.id, clienteId: f.cliente_id, fecha: f.fecha, quien: f.quien, tipo: f.tipo, nota: f.nota, alertaId: f.alerta_id, esPrueba: f.es_prueba });

const TABLA_FALTA = (error: { code?: string; message?: string } | null) => error?.code === "42P01" || /does not exist|schema cache/i.test(error?.message ?? "");

/** Los clientes reales (o null si faltan las tablas). */
export async function cargarClientesReales(supabase: Cliente, nucleos: Nucleo[]): Promise<ClienteSistema[] | null> {
  const { data, error } = await crudo(supabase).from("clientes_sistema").select("*").order("nombre");
  if (error) {
    if (TABLA_FALTA(error)) return null;
    throw new Error(`clientes_sistema: ${error.message}`);
  }
  return ((data ?? []) as FilaCliente[]).map((f) => aCliente(f, nucleos));
}

export async function cargarNucleos(supabase: Cliente): Promise<Nucleo[]> {
  const { data, error } = await crudo(supabase).from("nucleos").select("*").order("orden");
  if (error || !data || data.length === 0) return NUCLEOS_FIJOS;
  return (data as Nucleo[]).map((n) => ({ ...n, plantilla: esPlantilla(n.plantilla) ? n.plantilla : null }));
}

/** El panorama en modo ejemplo: todo calculado al vuelo. */
export function panoramaDeEjemplo(filtros: Filtros, motivo: string, hoy = new Date()): Panorama {
  const ejemplos = clientesDeEjemplo(hoy);
  const clientes: ClienteConIndicadores[] = ejemplos.map(({ cliente, perfil }) => {
    const uso = usoDeEjemplo(cliente, perfil, hoy);
    const indicadores = calcularIndicadores(cliente, uso, hoy);
    const anterior = SEMAFORO_ANTERIOR_EJEMPLO[cliente.id];
    const alertas = generarAlertas(cliente, uso, indicadores, [], anterior ? { semaforo: anterior } : null, hoy).map((a, i) => ({
      ...a,
      id: `${cliente.id}-al-${i}`,
      clienteId: cliente.id,
      fecha: hoy.toISOString(),
      estado: "nueva" as const,
      resolucion: null,
      esPrueba: true,
    }));
    return { ...cliente, indicadores, paso: pasoActivacion(cliente, uso), alertas };
  });
  return { modoEjemplo: true, motivoEjemplo: motivo, nucleos: NUCLEOS_FIJOS, clientes: aplicarFiltros(clientes, { ...filtros, incluirPrueba: true }), acompanamientos: acompanamientosDeEjemplo(hoy), filtros };
}

function aplicarFiltros(clientes: ClienteConIndicadores[], filtros: Filtros) {
  return clientes.filter((c) => (filtros.incluirPrueba || !c.esPrueba) && (filtros.responsable === "todos" || c.responsable === filtros.responsable));
}

/** El panorama completo, real o de ejemplo. */
export async function cargarPanorama(supabase: Cliente, filtros: Filtros, hoy = new Date()): Promise<Panorama> {
  const nucleos = await cargarNucleos(supabase);
  const clientesReales = await cargarClientesReales(supabase, nucleos);
  if (clientesReales === null) return panoramaDeEjemplo(filtros, "Faltan las tablas de Núcleos en la base (aplicar supabase/migrations/20261021140000_nucleos.sql).", hoy);
  if (!posthogConfigurado()) return panoramaDeEjemplo(filtros, "Falta la conexión con PostHog (POSTHOG_PROJECT_ID y POSTHOG_PERSONAL_API_KEY).", hoy);
  const reales = clientesReales.filter((c) => !c.esPrueba);
  if (reales.length === 0) return panoramaDeEjemplo(filtros, "Todavía no hay clientes del sistema cargados.", hoy);

  const ids = clientesReales.map((c) => c.id);
  const [fotos, alertas, acompanamientos] = await Promise.all([
    crudo(supabase).from("indicadores_diarios").select("cliente_id, dia, datos").in("cliente_id", ids).order("dia", { ascending: false }).limit(ids.length * 3),
    crudo(supabase).from("alertas").select("*").in("cliente_id", ids).in("estado", ["nueva", "vista"]).order("fecha", { ascending: false }),
    crudo(supabase).from("acompanamientos").select("*").in("cliente_id", ids).order("fecha", { ascending: false }).limit(200),
  ]);

  const ultimaFoto = new Map<string, Indicadores>();
  for (const f of (fotos.data ?? []) as { cliente_id: string; datos: Indicadores }[]) if (!ultimaFoto.has(f.cliente_id)) ultimaFoto.set(f.cliente_id, f.datos);
  const alertasPor = new Map<string, Alerta[]>();
  for (const f of (alertas.data ?? []) as FilaAlerta[]) alertasPor.set(f.cliente_id, [...(alertasPor.get(f.cliente_id) ?? []), aAlerta(f)]);

  const clientes: ClienteConIndicadores[] = clientesReales.map((c) => ({ ...c, indicadores: ultimaFoto.get(c.id) ?? null, paso: null, alertas: alertasPor.get(c.id) ?? [] }));
  return { modoEjemplo: false, motivoEjemplo: null, nucleos, clientes: aplicarFiltros(clientes, filtros), acompanamientos: ((acompanamientos.data ?? []) as FilaAcomp[]).map(aAcomp), filtros };
}

/** Un cliente de ejemplo con su uso (para la vista de cliente y el bloque de Claude en modo ejemplo). */
export function clienteDeEjemplo(id: string, hoy = new Date()) {
  const e = clientesDeEjemplo(hoy).find((x) => x.cliente.id === id);
  if (!e) return null;
  return { cliente: e.cliente, uso: usoDeEjemplo(e.cliente, e.perfil, hoy) };
}
