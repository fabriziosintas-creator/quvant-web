import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { estancada, esEtapa } from "@/comercial/comercial";
import { PANEL_ADMIN } from "@/datos/textos";
import type { Database } from "@/supabase/tipos";
import { crearAviso } from "./crear";

/**
 * Lo que el proceso diario revisa para los avisos (los de objetivos salen
 * de la foto diaria de Objetivos):
 *  · oportunidades estancadas (más días que el umbral de su etapa);
 *  · visitas interesantes que se fueron y visitas repetidas de una misma
 *    conexión, si pg_cron no está corriendo.
 */
export async function procesoDiarioAvisos(supabase: SupabaseClient<Database>) {
  const ahora = new Date().toISOString();
  let estancadas = 0;
  const { data: ops, error } = await supabase.from("oportunidades").select("id, negocio, etapa, etapa_desde, es_prueba").not("etapa", "in", "(ganado,perdido)").eq("es_prueba", false);
  if (!error) {
    for (const o of ops ?? []) {
      if (!esEtapa(o.etapa) || !estancada({ etapa: o.etapa, etapaDesde: o.etapa_desde }, ahora)) continue;
      const nuevo = await crearAviso({
        tipo: "oportunidad_estancada",
        titulo: `Estancada en «${PANEL_ADMIN.comercial.etapas[o.etapa]}»: ${o.negocio}`,
        enlace: `/panel/comercial/${o.id}`,
        clave: `op:${o.id}:${o.etapa}:${o.etapa_desde.slice(0, 10)}`,
      });
      if (nuevo) estancadas++;
    }
  }
  const [{ data: visitas }, { data: repetidas }] = await Promise.all([supabase.rpc("revisar_visitas_interesantes"), supabase.rpc("revisar_visitas_repetidas")]);
  return { estancadas, visitasInteresantes: typeof visitas === "number" ? visitas : 0, visitasRepetidas: typeof repetidas === "number" ? repetidas : 0 };
}
