"use server";

import { revalidatePath } from "next/cache";
import { PANEL_ADMIN } from "@/datos/textos";
import { esNicho, texto, type Errores } from "@/servidor/cuenta/validacion";
import type { Enums } from "@/supabase/tipos";
import { exigirAdmin } from "./acceso";

/**
 * Carga manual de clientes por plantilla (6.2): lo que vende de verdad.
 * Corre con la sesión del admin: la base solo deja escribir a admin.
 */

export type EstadoClientes = { estado: "inicial" | "error" | "listo"; mensaje?: string; errores?: Errores; valores?: Record<string, string> };

const ESTADOS: readonly Enums<"estado_cliente">[] = ["demo_mostrada", "en_prueba", "activo", "baja"];
const esEstado = (v: string): v is Enums<"estado_cliente"> => (ESTADOS as readonly string[]).includes(v);
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const E = PANEL_ADMIN.clientes.errores;

export async function agregarCliente(_previo: EstadoClientes, datos: FormData): Promise<EstadoClientes> {
  const { supabase, perfil } = await exigirAdmin("/panel/plantillas");
  const empresa = texto(datos, "empresa");
  const nicho = texto(datos, "nicho");
  const estado = texto(datos, "estado");
  const abonoTexto = texto(datos, "abono").replace(",", ".");
  const fecha = texto(datos, "fecha");
  const notas = texto(datos, "notas");
  const valores = { empresa, nicho, estado, abono: abonoTexto, fecha, notas };

  const errores: Errores = {};
  if (!empresa || empresa.length > 160) errores.empresa = E.empresa;
  if (!esNicho(nicho)) errores.nicho = E.nicho;
  if (!esEstado(estado)) errores.estado = E.estado;
  const abono = abonoTexto ? Number(abonoTexto) : null;
  if (abono !== null && (!Number.isFinite(abono) || abono < 0)) errores.abono = E.abono;
  if (!FECHA.test(fecha)) errores.fecha = E.fecha;
  if (notas.length > 2000) errores.general = E.general;
  if (Object.keys(errores).length > 0) return { estado: "error", errores, valores };

  const { error } = await supabase.from("clientes_plantilla").insert({
    empresa,
    nicho_id: nicho,
    estado: estado as Enums<"estado_cliente">,
    abono_mensual: abono,
    fecha,
    notas: notas || null,
    cargado_por: perfil.id,
  });
  if (error) {
    console.error("[clientes]", error.message);
    return { estado: "error", mensaje: E.general, valores };
  }
  revalidatePath("/panel/plantillas");
  return { estado: "listo", mensaje: PANEL_ADMIN.clientes.agregado };
}

export async function cambiarEstadoCliente(datos: FormData) {
  const { supabase } = await exigirAdmin("/panel/plantillas");
  const id = texto(datos, "id");
  const estado = texto(datos, "estado");
  if (!id || !esEstado(estado)) return;
  const { error } = await supabase.from("clientes_plantilla").update({ estado }).eq("id", id);
  if (error) console.error("[clientes] cambiar estado:", error.message);
  revalidatePath("/panel/plantillas");
}

export async function borrarCliente(datos: FormData) {
  const { supabase } = await exigirAdmin("/panel/plantillas");
  const id = texto(datos, "id");
  if (!id) return;
  const { error } = await supabase.from("clientes_plantilla").delete().eq("id", id);
  if (error) console.error("[clientes] borrar:", error.message);
  revalidatePath("/panel/plantillas");
}
