"use server";

import { revalidatePath, updateTag } from "next/cache";
import { PANEL_ADMIN } from "@/datos/textos";
import { exigirAdmin } from "@/servidor/panel/acceso";

/** Deshacer un cambio (la base revisa todo y lo anota como cambio nuevo) e ingresos al panel. */

const R = PANEL_ADMIN.bitacora.respuestas;

export async function deshacerCambio(id: number): Promise<{ ok: boolean; mensaje: string }> {
  const { supabase } = await exigirAdmin("/panel/bitacora");
  if (!Number.isInteger(id) || id <= 0) return { ok: false, mensaje: R.error };
  const { data, error } = await supabase.rpc("deshacer_cambio", { p_id: id });
  if (error) {
    console.error("[bitácora] deshacer:", error.message);
    return { ok: false, mensaje: R.error };
  }
  const codigo = (data ?? "error") as keyof typeof R;
  if (codigo === "ok") {
    updateTag("nichos");
    updateTag("hoy");
    revalidatePath("/panel", "layout");
  }
  return { ok: codigo === "ok", mensaje: R[codigo] ?? R.error };
}

/** Un ingreso al panel (la base anota uno cada 8 horas por persona). */
export async function anotarIngreso() {
  const { supabase } = await exigirAdmin("/panel");
  await supabase.rpc("anotar_en_bitacora", { p_accion: "ingreso", p_tabla: "panel" });
}
