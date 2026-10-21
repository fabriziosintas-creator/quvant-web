"use server";

import { revalidatePath } from "next/cache";
import { diaBA } from "@/objetivos/fechas";
import { exigirAdmin } from "@/servidor/panel/acceso";

/** Posponer una tarjeta de "Hoy" hasta mañana (solo para este admin; no toca los datos de origen). */
export async function posponerTarjeta(clave: string): Promise<boolean> {
  const { supabase, perfil } = await exigirAdmin("/panel");
  if (!/^[a-z0-9_:\-]{1,120}$/.test(clave)) return false;
  // Se oculta por hoy: mañana vuelve a aparecer si sigue pendiente.
  const hoy = diaBA(new Date());
  const { error } = await supabase.from("hoy_pospuestas").upsert({ perfil_id: perfil.id, clave, hasta: hoy, creado_en: new Date().toISOString() });
  if (error) {
    console.error("[hoy] posponer:", error.message);
    return false;
  }
  revalidatePath("/panel");
  return true;
}
