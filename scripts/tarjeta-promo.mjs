/**
 * node scripts/tarjeta-promo.mjs
 *
 * La tarjeta impresa de "Primeros 100" para dejar en los locales que se
 * visitan (docs/promo-primeros-100.md, sección F): un QR a la página de la
 * promo con utm_source=visita, para saber en el panel cuántos lugares
 * vinieron de la calle. Dos tamaños, en PDF y con una vista PNG:
 *   - A6 (105 × 148 mm), para dejar en el mostrador.
 *   - Tarjeta personal (85 × 55 mm).
 * Salen en ../marca/promo/ (fuera del repo). Usa las letras de la marca
 * (video/public/fonts) y la firma de los emails (public/email).
 */
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import QRCode from "qrcode";

const RAIZ = path.resolve(import.meta.dirname, "..");
const SALIDA = path.resolve(RAIZ, "..", "marca", "promo");
mkdirSync(SALIDA, { recursive: true });

const URL_PROMO = "https://www.quvant.com.ar/primeros-100?utm_source=visita";
const LINK_VISIBLE = "quvant.com.ar/primeros-100";
const HASTA = "31/01/2027"; // TODO: si cambia la fecha en promo_config, cambiarla acá.

// Las letras van embebidas: una página armada con setContent no puede leer archivos locales.
const fuente = (archivo) => {
  const tipo = archivo.endsWith(".woff2") ? "font/woff2" : "font/ttf";
  return `data:${tipo};base64,${readFileSync(path.join(RAIZ, "video", "public", "fonts", archivo)).toString("base64")}`;
};
const firma = `data:image/png;base64,${readFileSync(path.join(RAIZ, "public", "email", "quvant-firma.png")).toString("base64")}`;
// QR negro sobre blanco (lo leen todas las cámaras), con margen de 2 módulos y corrección media.
const qr = await QRCode.toString(URL_PROMO, { type: "svg", errorCorrectionLevel: "M", margin: 2, color: { dark: "#0D0D0F", light: "#FFFFFF" } });

const estilos = `
@font-face { font-family: "Plex Sans"; src: url("${fuente("IBMPlexSans-Regular.woff2")}"); font-weight: 400; }
@font-face { font-family: "Plex Sans"; src: url("${fuente("IBMPlexSans-SemiBold.woff2")}"); font-weight: 600; }
@font-face { font-family: "Plex Mono"; src: url("${fuente("IBMPlexMono-Regular.ttf")}"); }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #0D0D0F; color: #ECECEE; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.firma { display: block; height: auto; }
.cuadradito { display: inline-block; width: 0.32em; height: 0.32em; background: #7BD389; margin-right: 0.35em; vertical-align: 0.12em; }
.titulo { font-family: "Plex Sans"; font-weight: 600; letter-spacing: -0.02em; line-height: 1.04; }
.texto { font-family: "Plex Sans"; font-weight: 400; line-height: 1.35; color: #ECECEE; }
.chico { font-family: "Plex Sans"; color: #9C9CA3; line-height: 1.35; }
.link { font-family: "Plex Mono"; color: #ECECEE; }
.qr { background: #FFFFFF; border-radius: 3mm; padding: 1.2mm; }
.qr svg { display: block; width: 100%; height: 100%; }
`;

const A6 = `<!doctype html><html><head><meta charset="utf-8"><style>${estilos}
@page { size: 105mm 148mm; margin: 0; }
body { width: 105mm; height: 148mm; padding: 9mm 9mm 8mm; display: flex; flex-direction: column; }
</style></head><body>
<img class="firma" src="${firma}" style="width: 34mm">
<p class="titulo" style="font-size: 30pt; margin-top: 9mm"><span class="cuadradito"></span>Primeros 100</p>
<p class="texto" style="font-size: 11.5pt; margin-top: 4mm">2 meses gratis del sistema para administrar tu negocio, o 50 % en el desarrollo de tu web o tu app.</p>
<p class="chico" style="font-size: 9pt; margin-top: 2.5mm">Para las primeras 100 personas que se registran.</p>
<div style="display: flex; align-items: center; gap: 5mm; margin-top: auto">
  <div class="qr" style="width: 36mm; height: 36mm">${qr}</div>
  <div>
    <p class="texto" style="font-size: 10.5pt">Escaneá y mirá cómo funciona.</p>
    <p class="link" style="font-size: 7.5pt; margin-top: 2mm">${LINK_VISIBLE}</p>
  </div>
</div>
<p class="chico" style="font-size: 6.5pt; margin-top: 5mm">Hasta el ${HASTA} o hasta completar los 100 lugares. Bases y condiciones en la web.</p>
</body></html>`;

const PERSONAL = `<!doctype html><html><head><meta charset="utf-8"><style>${estilos}
@page { size: 85mm 55mm; margin: 0; }
body { width: 85mm; height: 55mm; padding: 5mm; display: flex; gap: 4mm; align-items: stretch; }
</style></head><body>
<div style="display: flex; flex-direction: column; flex: 1">
  <img class="firma" src="${firma}" style="width: 24mm">
  <p class="titulo" style="font-size: 15pt; margin-top: 3.5mm"><span class="cuadradito"></span>Primeros 100</p>
  <p class="texto" style="font-size: 7.2pt; margin-top: 1.8mm">2 meses gratis del sistema o 50 % en tu web o tu app.</p>
  <p class="link" style="font-size: 5.6pt; margin-top: auto">${LINK_VISIBLE}</p>
  <p class="chico" style="font-size: 4.6pt; margin-top: 1mm">Hasta el ${HASTA} o hasta completar los lugares.</p>
</div>
<div class="qr" style="width: 30mm; height: 30mm; align-self: center">${qr}</div>
</body></html>`;

const { chromium } = await import(pathToFileURL(path.join(RAIZ, "video", "node_modules", "playwright", "index.mjs")).href);
const navegador = await chromium.launch({ channel: "chrome" });
for (const [nombre, html, ancho, alto] of [
  ["tarjeta-primeros-100-A6", A6, 105, 148],
  ["tarjeta-primeros-100-personal", PERSONAL, 85, 55],
]) {
  const pagina = await navegador.newPage({ viewport: { width: Math.round((ancho / 25.4) * 96), height: Math.round((alto / 25.4) * 96) }, deviceScaleFactor: 4 });
  await pagina.setContent(html, { waitUntil: "load" });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.pdf({ path: path.join(SALIDA, `${nombre}.pdf`), width: `${ancho}mm`, height: `${alto}mm`, printBackground: true });
  await pagina.screenshot({ path: path.join(SALIDA, `${nombre}.png`) });
  await pagina.close();
  console.log("listo", nombre);
}
await navegador.close();
console.log(`QR → ${URL_PROMO}`);
