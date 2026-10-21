"use server";

import { revalidatePath } from "next/cache";
import { TIPOS_AVISO } from "@/avisos/avisos";
import { exigirAdmin } from "@/servidor/panel/acceso";

/** Lo leído y las preferencias de avisos, de cada admin (RLS: cada uno, lo suyo). */

export async function marcarLeidos(ids: number[]): Promise<boolean> {
  const { supabase, perfil } = await exigirAdmin("/panel");
  const validos = ids.filter((id) => Number.isInteger(id) && id > 0).slice(0, 200);
  if (validos.length === 0) return true;
  const { error } = await supabase.from("avisos_leidos").upsert(
    validos.map((id) => ({ aviso_id: id, perfil_id: perfil.id })),
    { onConflict: "aviso_id,perfil_id", ignoreDuplicates: true },
  );
  if (error) console.error("[avisos] leídos:", error.message);
  return !error;
}

export async function guardarPreferencias(_previo: { mensaje?: string }, datos: FormData): Promise<{ mensaje?: string }> {
  const { supabase, perfil } = await exigirAdmin("/panel/avisos");
  const ver = new Set(datos.getAll("ver").map(String));
  const whatsapp = datos.getAll("whatsapp").map(String).filter((t) => (TIPOS_AVISO as readonly string[]).includes(t));
  const apagados = TIPOS_AVISO.filter((t) => !ver.has(t));
  const { error } = await supabase.from("avisos_preferencias").upsert({ perfil_id: perfil.id, apagados, por_whatsapp: whatsapp, actualizado_en: new Date().toISOString() });
  if (error) {
    console.error("[avisos] preferencias:", error.message);
    return { mensaje: "No se pudo guardar. Probá de nuevo." };
  }
  revalidatePath("/panel/avisos");
  return { mensaje: "Listo, preferencias guardadas." };
}
