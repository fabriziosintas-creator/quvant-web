"use server";

import { uuidValido } from "@/servidor/cuenta/validacion";
import { adminDelPedido } from "./acceso";

/**
 * Anota el navegador de un admin (su id anónimo de visita) como del equipo:
 * sus visitas no cuentan en "Entraron y se registraron", ni las de antes ni
 * las de después. La llama el panel al abrirse (MarcarEquipo).
 */
export async function marcarNavegadorDelEquipo(visitaId: string) {
  const admin = await adminDelPedido();
  if (!admin || !uuidValido(visitaId)) return;
  const { error } = await admin.supabase
    .from("navegadores_equipo")
    .upsert({ visita_id: visitaId, perfil_id: admin.perfil.id }, { onConflict: "visita_id", ignoreDuplicates: true });
  if (error) console.error("[equipo]", error.message);
}
