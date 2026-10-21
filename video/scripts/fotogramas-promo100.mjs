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
const lista = segundos.length ? segundos : [1.6, 4.5, 8.5, 11.5, 17.5, 21.5, 30.5, 34.5, 40.5];
const COMPOSICION = process.env.COMPOSICION ?? "Promo100";
const carpeta = path.resolve("out", "promo100", "cuadros", COMPOSICION);
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
const composition = await selectComposition({ serveUrl, id: COMPOSICION, puppeteerInstance: browser, chromiumOptions });
for (const s of lista) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
  const salida = path.join(carpeta, `t${String(s.toFixed(1)).padStart(4, "0")}.png`);
  await renderStill({ composition, serveUrl, output: salida, frame, puppeteerInstance: browser, chromiumOptions, imageFormat: "png" });
  console.log("listo", salida);
}
await browser.close({ silent: true });
