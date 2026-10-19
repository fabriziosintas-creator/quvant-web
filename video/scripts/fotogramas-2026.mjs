/**
 * node scripts/fotogramas-2026.mjs [segundos...]
 *
 * Renderiza cuadros sueltos del spot 2026 (para revisar sin hacer el render
 * entero) en out/spot2026/cuadros/. Un solo navegador para todos.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const segundos = process.argv.slice(2).map(Number);
const lista = segundos.length ? segundos : [1, 2.1, 3.4, 4.2, 5.7, 6.9, 8.4, 9.6, 11, 13, 15, 17, 19, 20.3, 22.4, 24.6, 27.5, 29.4, 31.4, 32.9, 34.8, 36.1, 37, 38.4, 40];
const carpeta = path.resolve("out", "spot2026", "cuadros");
mkdirSync(carpeta, { recursive: true });

// Lo mismo que remotion.config.ts: los shaders se importan como texto.
const serveUrl = await bundle({
  entryPoint: path.resolve("src", "index.ts"),
  webpackOverride: (config) => ({
    ...config,
    module: { ...config.module, rules: [...(config.module?.rules ?? []), { test: /\.(glsl|vert|frag)$/, type: "asset/source" }] },
  }),
});
const chromiumOptions = { gl: "angle" };
const browser = await openBrowser("chrome", { chromiumOptions });
const composition = await selectComposition({ serveUrl, id: "Spot2026", puppeteerInstance: browser, chromiumOptions });
for (const s of lista) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
  const salida = path.join(carpeta, `t${String(s.toFixed(1)).padStart(4, "0")}.png`);
  await renderStill({ composition, serveUrl, output: salida, frame, puppeteerInstance: browser, chromiumOptions, imageFormat: "png" });
  console.log("listo", salida);
}
await browser.close({ silent: true });
