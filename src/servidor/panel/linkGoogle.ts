/**
 * Leer un link de Google Maps sin usar ninguna API de Google: el nombre
 * del lugar y sus coordenadas vienen escritos en el link largo. Así se
 * aprovecha lo que ya vemos en Google Maps (lo copiamos del celular con
 * "Compartir") sin clave ni facturación.
 *
 * Lo que se puede leer de un link largo, en orden de confianza:
 *  · !3d<lat>!4d<lng> en data=…: las coordenadas del lugar en sí.
 *  · q= / query= / ll= / destination= con "lat,lng".
 *  · @<lat>,<lng>: el centro de la pantalla (cerca del lugar, no exacto).
 * Y el nombre, de /place/<nombre>/ o /search/<texto>/ o q=<texto>.
 *
 * Los links cortos (maps.app.goo.gl) no traen nada: el servidor sigue la
 * redirección (ver seguirLinkCorto) y lee el largo. Este archivo no hace
 * pedidos, solo lee texto: por eso se puede probar solo.
 */

export type LeidoDeGoogle = {
  /** El link tal como vino (el que se guarda y se abre). */
  link: string;
  nombre: string | null;
  /** Lo que venía después del nombre (suele ser la dirección). */
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  /** Qué tan seguras son las coordenadas: del lugar, de la consulta o del centro de la pantalla. */
  precision: "lugar" | "consulta" | "pantalla" | null;
};

const HOSTS_GOOGLE = /^(?:www\.|maps\.)?google\.[a-z.]{2,8}$/i;
const HOSTS_CORTOS = new Set(["maps.app.goo.gl", "goo.gl", "g.co"]);

/** Los hosts a los que el servidor puede seguir una redirección (nada más: nada de pedidos a cualquier lado). */
export const esHostPermitido = (host: string) => HOSTS_GOOGLE.test(host) || HOSTS_CORTOS.has(host.toLowerCase()) || host.toLowerCase() === "consent.google.com";

export const esLinkCorto = (url: URL) => {
  const host = url.hostname.toLowerCase();
  if (host === "maps.app.goo.gl") return true;
  if (host === "goo.gl") return url.pathname.startsWith("/maps");
  if (host === "g.co") return url.pathname.startsWith("/kgs");
  return false;
};

export const esLinkDeMapas = (url: URL) => esLinkCorto(url) || (HOSTS_GOOGLE.test(url.hostname) && (url.pathname.startsWith("/maps") || url.searchParams.has("q") || url.searchParams.has("ll")));

/** Del texto que se pega (a veces "Nombre\nDirección\nhttps://…"), el link y lo que venía antes. */
export function separarTextoPegado(texto: string): { url: URL | null; antes: string[] } {
  const encontrado = texto.match(/https?:\/\/[^\s<>"']+/i);
  if (!encontrado) return { url: null, antes: [] };
  let url: URL | null = null;
  try {
    url = new URL(encontrado[0].replace(/[).,;]+$/, ""));
  } catch {
    url = null;
  }
  const antes = texto
    .slice(0, encontrado.index)
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean);
  return { url, antes };
}

const valida = (latitud: number, longitud: number) =>
  Number.isFinite(latitud) && Number.isFinite(longitud) && Math.abs(latitud) <= 90 && Math.abs(longitud) <= 180 && !(latitud === 0 && longitud === 0);

/** "lat,lng" (con espacios o +) → números, o null si no son coordenadas. */
function parCoordenadas(texto: string | null): [number, number] | null {
  if (!texto) return null;
  const m = texto.replace(/\+/g, " ").trim().match(/^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!m) return null;
  const par: [number, number] = [Number(m[1]), Number(m[2])];
  return valida(...par) ? par : null;
}

const decodificar = (segmento: string) => {
  try {
    return decodeURIComponent(segmento.replace(/\+/g, " ")).trim();
  } catch {
    return segmento.replace(/\+/g, " ").trim();
  }
};

/** "Café Tortoni, Av. de Mayo 825, C1084 CABA" → nombre y dirección. */
function partirNombre(texto: string): { nombre: string | null; direccion: string | null } {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (!limpio) return { nombre: null, direccion: null };
  const coma = limpio.indexOf(", ");
  if (coma < 0) return { nombre: limpio, direccion: null };
  return { nombre: limpio.slice(0, coma), direccion: limpio.slice(coma + 2) || null };
}

/** Lee un link largo de Google Maps (ya sin redirecciones). */
export function leerLinkLargo(url: URL, link = url.toString()): LeidoDeGoogle {
  const resultado: LeidoDeGoogle = { link, nombre: null, direccion: null, latitud: null, longitud: null, precision: null };
  const ruta = decodificar(url.pathname);
  const todo = `${url.pathname}${url.search}${url.hash}`;

  // Coordenadas del lugar: la última pareja !3d…!4d… del parámetro data.
  const lugares = [...todo.matchAll(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/g)];
  const ultimo = lugares.at(-1);
  if (ultimo && valida(Number(ultimo[1]), Number(ultimo[2]))) {
    resultado.latitud = Number(ultimo[1]);
    resultado.longitud = Number(ultimo[2]);
    resultado.precision = "lugar";
  }

  // Parámetros con "lat,lng" o con el texto buscado.
  const consulta = ["q", "query", "destination", "ll", "center"].map((p) => url.searchParams.get(p)).find((v) => v);
  const parConsulta = parCoordenadas(consulta ?? null);
  if (resultado.precision === null && parConsulta) {
    [resultado.latitud, resultado.longitud] = parConsulta;
    resultado.precision = "consulta";
  }

  // El centro de la pantalla: /@lat,lng,17z
  const arroba = url.pathname.match(/\/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (resultado.precision === null && arroba && valida(Number(arroba[1]), Number(arroba[2]))) {
    resultado.latitud = Number(arroba[1]);
    resultado.longitud = Number(arroba[2]);
    resultado.precision = "pantalla";
  }

  // El nombre: /maps/place/<nombre>/…, /maps/search/<texto>/… o q=<texto>.
  const lugar = url.pathname.match(/\/maps\/(?:place|search)\/([^/@]+)/);
  const textoNombre = lugar ? decodificar(lugar[1]) : consulta && !parConsulta ? consulta.replace(/\+/g, " ") : "";
  if (textoNombre && !parCoordenadas(textoNombre)) Object.assign(resultado, partirNombre(textoNombre));
  else if (!textoNombre && ruta.includes("/place/")) Object.assign(resultado, partirNombre(ruta.split("/place/")[1]?.split("/")[0] ?? ""));

  return resultado;
}

/**
 * Lee lo que se pegó. Devuelve null si no hay un link de Google Maps.
 * Si es un link corto, devuelve { corto } para que el servidor lo siga.
 */
export function leerTextoPegado(texto: string): { corto: URL; antes: string[] } | { leido: LeidoDeGoogle } | null {
  const { url, antes } = separarTextoPegado(texto);
  if (!url || !esLinkDeMapas(url)) return null;
  if (esLinkCorto(url)) return { corto: url, antes };
  const leido = leerLinkLargo(url);
  completarConLoQueVinoAntes(leido, antes);
  return { leido };
}

/** Si el link no traía nombre, el que se compartió arriba del link ("Nombre\nDirección\nlink"). */
export function completarConLoQueVinoAntes(leido: LeidoDeGoogle, antes: string[]) {
  if (!leido.nombre && antes[0]) leido.nombre = antes[0].slice(0, 160);
  if (!leido.direccion && antes[1]) leido.direccion = antes[1].slice(0, 300);
}

/** Cuando Google pide aceptar cookies (consent.google.com), el link real va en "continue". */
export function salirDelConsentimiento(url: URL): URL | null {
  if (url.hostname.toLowerCase() !== "consent.google.com") return null;
  const sigue = url.searchParams.get("continue");
  if (!sigue) return null;
  try {
    return new URL(sigue);
  } catch {
    return null;
  }
}

/** Distancia en metros entre dos puntos (fórmula del semiverseno). */
export function metrosEntre(a: { latitud: number; longitud: number }, b: { latitud: number; longitud: number }) {
  const R = 6_371_000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitud - a.latitud);
  const dLng = rad(b.longitud - a.longitud);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Para comparar nombres de locales: sin mayúsculas, tildes ni signos. */
export const nombreComparable = (nombre: string) =>
  nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'’´`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
