import "server-only";

/**
 * Ubicar un local por su nombre y ciudad con la Geocoding API de Google,
 * desde el servidor y con una clave privada (GOOGLE_MAPS_SERVER_KEY, sin
 * NEXT_PUBLIC_). Sin clave no ubica nada y lo dice: la importación sigue
 * y los locales quedan "sin ubicar" para corregirlos a mano.
 */

export const hayGeocodificacion = () => Boolean(process.env.GOOGLE_MAPS_SERVER_KEY);

export type Ubicacion = { latitud: number; longitud: number; direccion: string; place_id: string };

export async function geocodificar(consulta: string): Promise<Ubicacion | null> {
  const clave = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!clave) return null;
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", consulta);
  url.searchParams.set("region", "ar");
  url.searchParams.set("language", "es");
  url.searchParams.set("key", clave);
  try {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!respuesta.ok) return null;
    const json = (await respuesta.json()) as {
      status: string;
      results?: Array<{ formatted_address: string; place_id: string; geometry: { location: { lat: number; lng: number } } }>;
    };
    const mejor = json.status === "OK" ? json.results?.[0] : undefined;
    if (!mejor) return null;
    return {
      latitud: mejor.geometry.location.lat,
      longitud: mejor.geometry.location.lng,
      direccion: mejor.formatted_address,
      place_id: mejor.place_id,
    };
  } catch (error) {
    console.error("[geocodificar]", error instanceof Error ? error.message : error);
    return null;
  }
}
