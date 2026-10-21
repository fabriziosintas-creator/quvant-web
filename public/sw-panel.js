/*
 * El service worker del panel (prompt 5: la calle sin señal). Alcance solo
 * /panel/: la web pública no lo usa.
 *
 *  · /panel/mapa: primero la red; sin señal, la última copia que se vio.
 *  · Los archivos de Next (/_next/static, con nombre único) y el worker de
 *    MapLibre: guardados para abrir el mapa sin señal.
 *  · Mosaicos de OpenFreeMap: solo los que ya se vieron en pantalla (nunca
 *    se descargan zonas por adelantado), con tope de 2.000; los más viejos
 *    se van primero.
 *  · Background Sync: avisa a la pestaña abierta que mande la cola.
 *
 * Al cerrar sesión, el panel borra todas estas cachés.
 */

const VERSION = "v1";
const PAGINAS = `quvant-panel-paginas-${VERSION}`;
const ESTATICOS = `quvant-panel-estaticos-${VERSION}`;
const MOSAICOS = `quvant-panel-mosaicos-${VERSION}`;
const TOPE_MOSAICOS = 2000;
const PAGINAS_GUARDADAS = ["/panel/mapa"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(ESTATICOS)
      .then((c) => c.add("/maplibre/maplibre-gl-worker.mjs"))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n.startsWith("quvant-panel-") && ![PAGINAS, ESTATICOS, MOSAICOS].includes(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

let guardadosDesdeElRecorte = 0;
async function recortarMosaicos() {
  const cache = await caches.open(MOSAICOS);
  const claves = await cache.keys();
  // keys() devuelve en orden de llegada: los primeros son los más viejos.
  for (const vieja of claves.slice(0, Math.max(0, claves.length - TOPE_MOSAICOS))) await cache.delete(vieja);
}

async function primeroLaRed(pedido) {
  const url = new URL(pedido.url);
  try {
    const respuesta = await fetch(pedido);
    if (respuesta.ok && !respuesta.redirected && PAGINAS_GUARDADAS.includes(url.pathname)) {
      const cache = await caches.open(PAGINAS);
      await cache.put(url.pathname, respuesta.clone());
    }
    return respuesta;
  } catch {
    const guardada = await caches.match(url.pathname, { cacheName: PAGINAS });
    if (guardada) return guardada;
    return new Response(
      '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin señal · Quvant</title>' +
        '<body style="background:#0D0D0F;color:#ECECEE;font-family:monospace;padding:24px;line-height:1.6">' +
        "<p>Sin señal. Esta página no está guardada en el teléfono.</p>" +
        '<p><a href="/panel/mapa" style="color:#ECECEE">Abrir el mapa guardado</a></p></body></html>',
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}

async function primeroLaCache(pedido, nombre) {
  const guardada = await caches.match(pedido, { cacheName: nombre });
  if (guardada) return guardada;
  const respuesta = await fetch(pedido);
  if (respuesta.ok) {
    const cache = await caches.open(nombre);
    await cache.put(pedido, respuesta.clone());
    if (nombre === MOSAICOS && ++guardadosDesdeElRecorte >= 50) {
      guardadosDesdeElRecorte = 0;
      recortarMosaicos();
    }
  }
  return respuesta;
}

async function guardadaYActualizar(pedido, nombre) {
  const cache = await caches.open(nombre);
  const guardada = await cache.match(pedido);
  const deLaRed = fetch(pedido)
    .then((r) => {
      if (r.ok) cache.put(pedido, r.clone());
      return r;
    })
    .catch(() => guardada);
  return guardada || deLaRed;
}

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);

  if (url.origin === self.location.origin) {
    if (pedido.mode === "navigate" && url.pathname.startsWith("/panel")) return evento.respondWith(primeroLaRed(pedido));
    if (url.pathname.startsWith("/_next/static/")) return evento.respondWith(primeroLaCache(pedido, ESTATICOS));
    if (url.pathname.startsWith("/maplibre/") || url.pathname.startsWith("/fuentes/")) return evento.respondWith(guardadaYActualizar(pedido, ESTATICOS));
    return;
  }

  if (url.hostname === "tiles.openfreemap.org") {
    // Mosaicos (con número de versión en la dirección): primero la caché. Estilo, letras e íconos: la guardada y se actualiza.
    if (/\.pbf$/.test(url.pathname) && !url.pathname.startsWith("/fonts/")) return evento.respondWith(primeroLaCache(pedido, MOSAICOS));
    return evento.respondWith(guardadaYActualizar(pedido, ESTATICOS));
  }
});

self.addEventListener("sync", (evento) => {
  if (evento.tag !== "quvant-cola") return;
  evento.waitUntil(
    self.clients.matchAll({ type: "window" }).then((pestanas) => {
      for (const p of pestanas) p.postMessage("quvant:sincronizar");
    }),
  );
});
