import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calcularValor } from "@/objetivos/catalogo";
import { calcularAvance, resultadoDelCierre } from "@/objetivos/estado";
import { diaBA, diasEntre, limitesDelMes, sumarDias } from "@/objetivos/fechas";
import type { Dia, Meta } from "@/objetivos/tipos";
import type { Database } from "@/supabase/tipos";
import { cargarDatos, cargarMetas, desdeNecesario } from "./datos";

/**
 * Los procesos de Objetivos: la foto diaria del avance (para la curva) y el
 * cierre de los períodos terminados (foto inmutable de cumplido o no, y si
 * el objetivo se repite, el del período siguiente).
 *
 * Corren dentro del proceso diario que ya existe (Vercel Cron, ver
 * /api/nucleos/actualizar) con la clave secreta, y a mano desde el panel
 * ("Cerrar período ahora") con la sesión del admin.
 */

type Cliente = SupabaseClient<Database>;

export const hoyBA = () => diaBA(new Date());

/** El período siguiente de un objetivo que se repite. */
export function periodoSiguiente(meta: Pick<Meta, "tipoPeriodo" | "desde" | "hasta">): { desde: Dia; hasta: Dia } {
  const desde = sumarDias(meta.hasta, 1);
  if (meta.tipoPeriodo === "mes") return limitesDelMes(desde);
  if (meta.tipoPeriodo === "trimestre") {
    const tercero = sumarDias(limitesDelMes(sumarDias(limitesDelMes(desde).hasta, 1)).hasta, 1);
    return { desde, hasta: limitesDelMes(tercero).hasta };
  }
  return { desde, hasta: sumarDias(desde, diasEntre(meta.desde, meta.hasta)) };
}

/** Guarda la foto de hoy de cada objetivo abierto. */
export async function fotografiar(supabase: Cliente, hoy = hoyBA()) {
  const metas = (await cargarMetas(supabase)).filter((m) => m.desde <= hoy && hoy <= m.hasta);
  if (metas.length === 0) return 0;
  const datos = await cargarDatos(supabase, desdeNecesario(metas, hoy), hoy);
  const fotos = metas.map((m) => {
    const a = calcularAvance(datos, m, hoy);
    const estado = a.estado === "no_cumplido" ? "atrasado" : a.estado;
    return { meta_id: m.id, dia: hoy, valor: a.valor, porcentaje: a.avance === null ? null : Math.round(a.avance * 10_000) / 100, estado };
  });
  const { error } = await supabase.from("metas_fotos").upsert(fotos, { onConflict: "meta_id,dia" });
  if (error) throw new Error(`metas_fotos: ${error.message}`);
  return fotos.length;
}

/** Cierra los períodos terminados que todavía no tienen cierre. Devuelve cuántos cerró y cuántos se cumplieron. */
export async function cerrarPeriodos(supabase: Cliente, hoy = hoyBA()) {
  const terminadas = (await cargarMetas(supabase)).filter((m) => m.hasta < hoy);
  if (terminadas.length === 0) return { cerrados: 0, cumplidos: 0, repetidos: 0 };
  const { data: yaCerradas, error } = await supabase.from("metas_cierres").select("meta_id, desde, hasta").in("meta_id", terminadas.map((m) => m.id));
  if (error) throw new Error(`metas_cierres: ${error.message}`);
  const cerrada = new Set((yaCerradas ?? []).map((c) => `${c.meta_id}|${c.desde}|${c.hasta}`));
  const porCerrar = terminadas.filter((m) => !cerrada.has(`${m.id}|${m.desde}|${m.hasta}`));
  if (porCerrar.length === 0) return { cerrados: 0, cumplidos: 0, repetidos: 0 };

  const datos = await cargarDatos(supabase, desdeNecesario(porCerrar, hoy), hoy);
  let cumplidos = 0;
  let repetidos = 0;
  for (const m of porCerrar) {
    const valor = calcularValor(datos, m, hoy, m.hasta);
    const resultado = resultadoDelCierre(m, valor);
    if (resultado === "cumplido") cumplidos++;
    const porcentaje = valor === null || m.meta === 0 ? null : Math.round((m.direccion === "menos_es_mejor" ? (valor <= 0 ? 1 : m.meta / valor) : valor / m.meta) * 10_000) / 100;
    const { error: errorCierre } = await supabase.from("metas_cierres").insert({ meta_id: m.id, desde: m.desde, hasta: m.hasta, meta: m.meta, valor, resultado, porcentaje });
    if (errorCierre && errorCierre.code !== "23505") throw new Error(`cierre: ${errorCierre.message}`);

    if (m.seRepite) {
      const { data: hija } = await supabase.from("metas").select("id").eq("repite_de", m.id).limit(1).maybeSingle();
      if (!hija) {
        const siguiente = periodoSiguiente(m);
        const { error: errorRepite } = await supabase.from("metas").insert({
          nombre: m.nombre.replace(/ · [a-záéíóú]+$/i, ""),
          descripcion: m.descripcion,
          metrica: m.metrica,
          filtros: m.filtros,
          area: m.area,
          etapa: m.etapa,
          tipo_periodo: m.tipoPeriodo,
          desde: siguiente.desde,
          hasta: siguiente.hasta,
          meta_valor: m.meta,
          meta_original: m.meta,
          unidad: m.unidad,
          direccion: m.direccion,
          acumulacion: m.acumulacion,
          responsable: m.responsable,
          se_repite: true,
          orden: m.orden,
          repite_de: m.id,
          es_prueba: m.esPrueba,
        });
        if (errorRepite) console.error("[objetivos] repetir:", errorRepite.message);
        else repetidos++;
      }
    }
  }
  return { cerrados: porCerrar.length, cumplidos, repetidos };
}

/** Lo que corre el proceso diario: cerrar lo terminado y sacar la foto de hoy. */
export async function procesoDiarioObjetivos(supabase: Cliente) {
  const hoy = hoyBA();
  const cierre = await cerrarPeriodos(supabase, hoy);
  const fotos = await fotografiar(supabase, hoy);
  return { ...cierre, fotos };
}
