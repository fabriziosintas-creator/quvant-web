// Copia el worker de MapLibre a public/maplibre/ antes de "dev" y "build".
//
// MapLibre 6 busca su worker al lado del archivo desde el que se lo importa
// (import.meta.url). Empaquetado por Next, eso apunta a /_next/static/chunks/,
// donde el worker no existe, y el mapa no dibuja ningún mosaico. Con el
// worker servido desde /maplibre/ y setWorkerUrl (src/componentes/panel/mapa/
// maplibre.ts), anda igual en desarrollo y en producción, y siempre en la
// misma versión que el paquete instalado.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const raiz = path.dirname(require.resolve("maplibre-gl/package.json"));
const origen = path.join(raiz, "dist", "maplibre-gl-worker.mjs");
const destino = path.join(process.cwd(), "public", "maplibre", "maplibre-gl-worker.mjs");
mkdirSync(path.dirname(destino), { recursive: true });
copyFileSync(origen, destino);
console.log("[maplibre] worker copiado a public/maplibre/");
