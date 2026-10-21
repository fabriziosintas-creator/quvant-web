/**
 * Carga MapLibre (import diferido: solo en las páginas con mapa) y le dice
 * dónde está su worker. Sin esto, empaquetado por Next, MapLibre busca el
 * worker en /_next/static/chunks/ y no dibuja ningún mosaico. El worker lo
 * copia scripts/copiar-worker-maplibre.mjs antes de "dev" y "build".
 */
let configurado = false;

export async function cargarMapLibre() {
  const maplibre = await import("maplibre-gl");
  if (!configurado) {
    maplibre.setWorkerUrl(`/maplibre/maplibre-gl-worker.mjs?v=${maplibre.getVersion()}`);
    configurado = true;
  }
  return maplibre;
}
