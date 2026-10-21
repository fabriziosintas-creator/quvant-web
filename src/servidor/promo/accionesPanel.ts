"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath, updateTag } from "next/cache";
import { esBeneficio } from "@/datos/promo";
import { uuidValido } from "@/servidor/cuenta/validacion";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { ESTADOS_EDITABLES } from "./panel";
import { ETIQUETA_PROMO } from "./estado";

/**
 * Lo que los socios cambian de "Primeros 100" desde el panel: el estado,
 * el beneficio y las notas de un lugar, y pausar o reabrir la promo. El
 * número y de quién es el lugar no se tocan (la base lo impide igual).
 */

const RUTA = "/panel/primeros-100";

export async function guardarLugar(datos: FormData) {
  const { supabase } = await exigirAdmin(RUTA);
  const id = String(datos.get("id") ?? "");
  const estado = String(datos.get("estado") ?? "");
  const beneficio = String(datos.get("beneficio") ?? "");
  const notas = String(datos.get("notas") ?? "").trim().slice(0, 2000);
  if (!uuidValido(id)) return;
  const cambios: Record<string, unknown> = { notas: notas || null };
  if ((ESTADOS_EDITABLES as readonly string[]).includes(estado)) cambios.estado = estado;
  if (esBeneficio(beneficio)) cambios.beneficio = beneficio;
  const { error } = await (supabase as unknown as SupabaseClient).from("promo_lugares").update(cambios).eq("id", id);
  if (error) console.error("[promo] guardar lugar:", error.message);
  revalidatePath(RUTA);
}

export async function cambiarPromoActiva(datos: FormData) {
  const { supabase } = await exigirAdmin(RUTA);
  const activa = datos.get("activa") === "si";
  const { error } = await (supabase as unknown as SupabaseClient).from("promo_config").update({ activa }).eq("id", true);
  if (error) console.error("[promo] activa:", error.message);
  updateTag(ETIQUETA_PROMO);
  revalidatePath(RUTA);
}
