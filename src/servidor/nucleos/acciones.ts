"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { PANEL_ADMIN } from "@/datos/textos";
import type { Acompanamiento } from "@/nucleos/tipos";
import { texto } from "@/servidor/cuenta/validacion";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { analizarCliente, type AnalisisCliente } from "./claude";
import { cargarPanorama, clienteDeEjemplo, leerFiltrosNucleos } from "./datos";
import { calcularIndicadores } from "@/nucleos/indicadores";
import { correrProcesoDiario, type ResultadoProceso } from "./proceso";

/** Acciones de Núcleos. Todas verifican el rol admin en el servidor. */

const T = PANEL_ADMIN.nucleos;
type Estado = { estado: "inicial" | "error" | "listo"; mensaje?: string };

const TIPOS_ACOMP: readonly Acompanamiento["tipo"][] = ["llamada", "visita", "capacitacion", "mensaje", "correccion", "novedad"];
// Las tablas de Núcleos no están en los tipos generados todavía: se consultan sin tipos.
const tabla = (supabase: Awaited<ReturnType<typeof exigirAdmin>>["supabase"], nombre: string) => (supabase as unknown as SupabaseClient).from(nombre);

export async function actualizarAhora(): Promise<ResultadoProceso> {
  await exigirAdmin("/panel/nucleos");
  const resultado = await correrProcesoDiario();
  revalidatePath("/panel/nucleos", "layout");
  return resultado;
}

export async function registrarAcompanamiento(_previo: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin("/panel/nucleos");
  const clienteId = texto(datos, "clienteId");
  const tipo = texto(datos, "tipo") as Acompanamiento["tipo"];
  const nota = texto(datos, "nota");
  const alertaId = texto(datos, "alertaId");
  const fecha = texto(datos, "fecha");
  if (!clienteId || !TIPOS_ACOMP.includes(tipo)) return { estado: "error", mensaje: T.cliente.acompanamientoError };
  if (clienteId.startsWith("ejemplo-")) return { estado: "error", mensaje: T.ejemplo.noSeGuarda };
  const { error } = await tabla(supabase, "acompanamientos").insert({
    cliente_id: clienteId,
    tipo,
    nota: nota.slice(0, 2000) || null,
    alerta_id: alertaId || null,
    ...(fecha ? { fecha } : {}),
  });
  if (error) return { estado: "error", mensaje: `${T.cliente.acompanamientoError} (${error.message})` };
  if (alertaId) await tabla(supabase, "alertas").update({ estado: "resuelta", resuelta_en: new Date().toISOString(), resolucion: `Acompañamiento: ${tipo}` }).eq("id", alertaId);
  revalidatePath("/panel/nucleos", "layout");
  return { estado: "listo", mensaje: T.cliente.acompanamientoListo };
}

export async function cambiarEstadoAlerta(datos: FormData) {
  const { supabase, perfil } = await exigirAdmin("/panel/nucleos");
  const id = texto(datos, "id");
  const estado = texto(datos, "estado");
  if (!id || !["vista", "resuelta", "descartada"].includes(estado) || id.includes("-al-")) return;
  const cierre = estado === "resuelta" || estado === "descartada" ? { resuelta_por: perfil.id, resuelta_en: new Date().toISOString(), resolucion: texto(datos, "resolucion").slice(0, 1000) || null } : {};
  const { error } = await tabla(supabase, "alertas").update({ estado, ...cierre }).eq("id", id);
  if (error) console.error("[nucleos] alerta:", error.message);
  revalidatePath("/panel/nucleos", "layout");
}

/** El bloque de Claude: nunca manda nada solo, devuelve el análisis para mostrarlo y editar el borrador. */
export async function pedirAnalisis(clienteId: string): Promise<AnalisisCliente | { error: string }> {
  const { supabase } = await exigirAdmin("/panel/nucleos");
  const panorama = await cargarPanorama(supabase, leerFiltrosNucleos({ prueba: "1" }));
  const cliente = panorama.clientes.find((c) => c.id === clienteId);
  if (!cliente) return { error: T.cliente.noEncontrado };
  let indicadores = cliente.indicadores;
  if (!indicadores && panorama.modoEjemplo) {
    const e = clienteDeEjemplo(clienteId);
    if (e) indicadores = calcularIndicadores(e.cliente, e.uso);
  }
  if (!indicadores) return { error: T.cliente.sinIndicadores };
  const acompanamientos = panorama.acompanamientos.filter((a) => a.clienteId === clienteId);
  return analizarCliente({ cliente, indicadores, alertas: cliente.alertas, acompanamientos });
}
