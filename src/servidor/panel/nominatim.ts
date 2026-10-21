import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SITIO } from "@/datos/sitio";
import type { Database, Json } from "@/supabase/tipos";

/**
 * Buscar direcciones con Nominatim (el buscador de OpenStreetMap), sin
 * clave y sin costo, respetando su política de uso
 * (operations.osmfoundation.org/policies/nominatim):
 *  · como mucho una consulta por segundo (la fila de abajo las espacia);
 *  · un User-Agent que dice quiénes somos (con NOMINATIM_CONTACTO, un
 *    email, si está cargado);
 *  · nada de autocompletar: se busca al tocar "Buscar", nunca al escribir;
 *  · todo lo que responde se guarda (tabla geocodificaciones) y no se
 *    vuelve a preguntar.
 * Siempre desde el servidor y con la sesión del admin (la tabla es solo
 * de admin). La atribución "© OpenStreetMap" va en el mapa y al lado de
 * los resultados.
 */

type Cliente = SupabaseClient<Database>;

export type Lugar = {
  /** Nombre del lugar si OpenStreetMap lo tiene (un comercio, por ejemplo). */
  nombre: string | null;
  /** Calle y número, o lo más cercano que haya. */
  direccion: string;
  ciudad: string | null;
  provincia: string | null;
  latitud: number;
  longitud: number;
  /** N123 (punto), W45 (calle o edificio), R6 (área). */
  osm_id: string | null;
  /** La dirección completa, para mostrar en la lista de resultados. */
  completa: string;
};

const BASE = "https://nominatim.openstreetmap.org";
const ESPERA_MS = 1100;

const agente = () => {
  const contacto = process.env.NOMINATIM_CONTACTO?.trim();
  return `Quvant-panel/1.0 (+${SITIO.url}${contacto ? `; ${contacto}` : ""})`;
};

// Una consulta por vez, separadas por más de un segundo. Vale dentro de
// una instancia del servidor; con dos socios usando el panel alcanza.
let fila: Promise<unknown> = Promise.resolve();
let ultima = 0;
function enTurno<T>(trabajo: () => Promise<T>): Promise<T> {
  const siguiente = fila.then(async () => {
    const espera = ultima + ESPERA_MS - Date.now();
    if (espera > 0) await new Promise((listo) => setTimeout(listo, espera));
    try {
      return await trabajo();
    } finally {
      ultima = Date.now();
    }
  });
  fila = siguiente.catch(() => undefined);
  return siguiente;
}

type RespuestaNominatim = {
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: Record<string, string | undefined>;
};

function aLugar(r: RespuestaNominatim): Lugar | null {
  const latitud = Number(r.lat);
  const longitud = Number(r.lon);
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) return null;
  const a = r.address ?? {};
  const calle = [a.road ?? a.pedestrian ?? a.footway, a.house_number].filter(Boolean).join(" ");
  const tipo = r.osm_type?.[0]?.toUpperCase();
  return {
    nombre: r.name?.trim() || null,
    direccion: calle || a.suburb || a.neighbourhood || r.display_name.split(",")[0],
    ciudad: a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? null,
    provincia: a.state ?? null,
    latitud,
    longitud,
    osm_id: tipo && ["N", "W", "R"].includes(tipo) && r.osm_id ? `${tipo}${r.osm_id}` : null,
    completa: r.display_name,
  };
}

async function guardado(supabase: Cliente, clave: string): Promise<Lugar[] | null> {
  const { data } = await supabase.from("geocodificaciones").select("resultado").eq("clave", clave).maybeSingle();
  return data ? (data.resultado as unknown as Lugar[]) : null;
}

async function guardar(supabase: Cliente, clave: string, lugares: Lugar[]) {
  const { error } = await supabase.from("geocodificaciones").upsert({ clave, resultado: lugares as unknown as Json });
  if (error) console.error("[nominatim] guardar:", error.message);
}

/** null: Nominatim no respondió (se puede reintentar). [] : respondió que no hay nada. */
async function consultar(ruta: string, parametros: Record<string, string>): Promise<RespuestaNominatim[] | null> {
  const url = new URL(ruta, BASE);
  for (const [k, v] of Object.entries({ format: "jsonv2", addressdetails: "1", "accept-language": "es", ...parametros })) url.searchParams.set(k, v);
  return enTurno(async () => {
    try {
      const respuesta = await fetch(url, { headers: { "User-Agent": agente(), Referer: SITIO.url }, signal: AbortSignal.timeout(10_000), cache: "no-store" });
      if (!respuesta.ok) {
        console.error("[nominatim]", respuesta.status, ruta);
        return null;
      }
      const json = (await respuesta.json()) as RespuestaNominatim | RespuestaNominatim[] | { error?: string };
      if (Array.isArray(json)) return json;
      return "lat" in json ? [json] : [];
    } catch (error) {
      console.error("[nominatim]", error instanceof Error ? error.message : error);
      return null;
    }
  });
}

/** Buscar una dirección o un lugar en la Argentina. Hasta `limite` resultados. */
export async function buscarLugar(supabase: Cliente, consulta: string, limite = 5): Promise<Lugar[] | null> {
  const texto = consulta.replace(/\s+/g, " ").trim().slice(0, 300);
  if (texto.length < 3) return [];
  const clave = `buscar:${limite}:${texto.toLowerCase()}`;
  const previo = await guardado(supabase, clave);
  if (previo) return previo;
  const crudo = await consultar("/search", { q: texto, countrycodes: "ar", limit: String(limite) });
  if (crudo === null) return null;
  const lugares = crudo.map(aLugar).filter((l): l is Lugar => l !== null);
  await guardar(supabase, clave, lugares);
  return lugares;
}

/** La dirección de un punto ("Estoy acá"). */
export async function lugarEn(supabase: Cliente, latitud: number, longitud: number): Promise<Lugar | null> {
  const clave = `inverso:${latitud.toFixed(5)},${longitud.toFixed(5)}`;
  const previo = await guardado(supabase, clave);
  if (previo) return previo[0] ?? null;
  const crudo = await consultar("/reverse", { lat: String(latitud), lon: String(longitud), zoom: "18" });
  if (crudo === null) return null;
  const lugares = crudo.map(aLugar).filter((l): l is Lugar => l !== null);
  await guardar(supabase, clave, lugares);
  return lugares[0] ?? null;
}
