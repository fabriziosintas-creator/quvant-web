"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { refresh, updateTag } from "next/cache";
import { PROMO, PROMO_TEXTOS, esBeneficio } from "@/datos/promo";
import { exigirPerfil } from "@/servidor/cuenta/sesion";
import type { Errores } from "@/servidor/cuenta/validacion";
import { ETIQUETA_PROMO } from "./estado";

/**
 * Reservar un lugar de "Primeros 100" desde la cuenta (personas que ya
 * confirmaron su email). El número lo da la base (reservar_lugar_promo),
 * con la sesión de la persona; acá solo se valida y se refresca.
 */

export type EstadoReserva = { estado: "inicial" | "error" | "listo" | "espera"; mensaje?: string; errores?: Errores };

export async function reservarLugar(_previo: EstadoReserva, datos: FormData): Promise<EstadoReserva> {
  const { perfil, supabase } = await exigirPerfil("/cuenta");
  const T = PROMO_TEXTOS;
  const beneficio = String(datos.get("promo_beneficio") ?? "");
  if (!esBeneficio(beneficio)) return { estado: "error", errores: { promo_beneficio: T.registro.errores.beneficio } };
  if (beneficio === "sistema_1_mes" && !(PROMO.rubrosSistema as readonly string[]).includes(perfil.nicho_id)) {
    return { estado: "error", errores: { promo_beneficio: T.registro.errores.noDisponible } };
  }

  // La función todavía no está en los tipos generados hasta aplicar la migración.
  const { data, error } = await (supabase as unknown as SupabaseClient).rpc("reservar_lugar_promo", { beneficio });
  if (error) {
    console.error("[promo] reservar:", error.code, error.message);
    return { estado: "error", mensaje: T.cuenta.reservar.error };
  }
  updateTag(ETIQUETA_PROMO);
  refresh();
  const resultado = data as { estado?: string } | null;
  return resultado?.estado === "espera"
    ? { estado: "espera", mensaje: T.cuenta.reservar.espera }
    : { estado: "listo", mensaje: T.cuenta.reservar.listo };
}
