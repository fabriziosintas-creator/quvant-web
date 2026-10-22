import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { configSupabase } from "@/supabase/entorno";

/**
 * Cuántos lugares quedan de "Primeros 100", para la web (cinta, página,
 * registro). Solo números: lo da la función estado_promo() de la base,
 * con la clave pública. En caché un minuto (cacheLife "minutes"), así la
 * cinta no consulta la base en cada visita; cuando se da un lugar, la
 * acción que lo da invalida la etiqueta "promo".
 *
 * Si la base todavía no tiene la promo (migración sin aplicar) o no hay
 * Supabase, devuelve null y la web no muestra nada de la promo.
 */

export type EstadoPromo = {
  activa: boolean;
  /** El día en que se abrió desde el panel (fecha de comienzo de la oferta), o null si todavía no se abrió. */
  desde: string | null;
  tope: number;
  dados: number;
  quedan: number;
  hasta: string;
  rubros_sistema: string[];
};

export const ETIQUETA_PROMO = "promo";

export async function obtenerEstadoPromo(): Promise<EstadoPromo | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(ETIQUETA_PROMO);

  const config = configSupabase();
  if (!config) return null;
  const supabase = createClient(config.url, config.clavePublica, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.rpc("estado_promo");
  if (error || !data) {
    if (error && error.code !== "PGRST202") console.error("[promo] estado:", error.code, error.message);
    return null;
  }
  return data as EstadoPromo;
}

/** ¿Se muestra la promo? Activa y con lugares (con la promo llena, la página dice que se completó). */
export const promoAbierta = (estado: EstadoPromo | null) => Boolean(estado?.activa && estado.quedan > 0);
