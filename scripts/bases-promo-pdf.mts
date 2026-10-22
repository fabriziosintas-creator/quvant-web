/**
 * npx tsx scripts/bases-promo-pdf.mts
 *
 * Las bases y condiciones de "Primeros 100" en PDF, con la revisión: qué se
 * cambió y por qué, qué falta completar y las dudas que quedan abiertas
 * (por si más adelante se consulta a un abogado; por ahora no hace falta,
 * decisión de fabrizio). Las bases salen de src/datos/promo.ts (las mismas de la web).
 * Sale en ../marca/promo/bases-primeros-100-revisadas.pdf (fuera del repo).
 */
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PROMO_TEXTOS } from "../src/datos/promo";

const RAIZ = path.resolve(import.meta.dirname, "..");
const SALIDA = path.resolve(RAIZ, "..", "marca", "promo");
mkdirSync(SALIDA, { recursive: true });

const fuente = (archivo: string) => {
  const tipo = archivo.endsWith(".woff2") ? "font/woff2" : "font/ttf";
  return `data:${tipo};base64,${readFileSync(path.join(RAIZ, "video", "public", "fonts", archivo)).toString("base64")}`;
};
const html = (texto: string) => texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Los datos que faltan van entre corchetes: se marcan para que no se pasen por alto. */
const conHuecos = (texto: string) => html(texto).replace(/\[([^\]]+)\]/g, '<span class="hueco">[$1]</span>');

const BASES = PROMO_TEXTOS.bases.items.map((item) =>
  item.replace("{desde}", "[la fecha en que se abre la promo]").replace("{hasta}", "31 de enero de 2027").replace("{tope}", "100"),
);

const CAMBIOS: Array<[string, string, string]> = [
  [
    "Fecha de comienzo",
    "Decía «desde la publicación». La Ley 24.240 (art. 7) pide que la oferta tenga fecha precisa de comienzo y de finalización, y hay multas confirmadas por publicitar promociones sin fecha de inicio.",
    "La promo arranca cerrada y se abre desde el panel: ese día queda como fecha de comienzo y aparece en las bases, en la página y en la tarjeta impresa.",
  ],
  [
    "Organizador",
    "No se identificaba quién ofrece la promoción.",
    "Cláusula 1: organiza Quvant, con su WhatsApp de contacto. Por ahora sin razón social, CUIT, domicilio ni email (decisión de fabrizio, 22-oct-2026).",
  ],
  [
    "Después del mes gratis",
    "Fijaba un precio del abono que todavía no está definido.",
    "Sin precio: no hay cobro automático; antes de que termine el mes se informa por escrito el precio vigente y solo sigue quien lo acepta de forma expresa. Así la prueba gratis no se convierte en una suscripción sin consentimiento.",
  ],
  [
    "Base del 50 %",
    "El descuento era «sobre el presupuesto», sin decir cómo se arma. Un precio inflado para descontarle la mitad sería publicidad engañosa (Ley 24.240, art. 8; DNU 274/2019, art. 11, sobre precio y condiciones).",
    "El presupuesto se arma con los mismos criterios y precios que para cualquier cliente y muestra precio sin descuento, descuento y total.",
  ],
  [
    "Plazos que dependían de Quvant",
    "Los 90 días corrían desde que se asignaba el lugar y los 60 días «para activar» aunque Quvant se demorara. Un plazo que vence por demora del proveedor puede ser una cláusula abusiva (Ley 24.240, art. 37).",
    "Quvant manda el presupuesto en 15 días hábiles y los 90 días corren desde que se recibe; los 60 días corren desde que Quvant ofrece una fecha y se extienden si la demora es de Quvant; el mes corre desde que el sistema funciona.",
  ],
  [
    "Lista de espera",
    "La web prometía «si se libera un lugar, te escribimos» sin un mecanismo para darlo.",
    "Estar en espera no da derecho al beneficio; si se abren más lugares, se avisa y se reserva desde la cuenta (el sistema ya lo permite). Un lugar asignado no pasa a otra persona.",
  ],
  [
    "Quién participa",
    "Faltaban la edad, la regla de «un lugar por negocio» y la exclusión del equipo.",
    "Mayores de 18 años, datos verdaderos, un lugar por negocio (vale el primer registro) y sin cuentas del equipo.",
  ],
  [
    "Baja",
    "No se decía cómo dejar el beneficio.",
    "Se deja en cualquier momento, sin costo y por el mismo medio por el que se pidió (Ley 24.240, art. 10 ter; Disposición 954/2025).",
  ],
  [
    "Datos personales",
    "No había cláusula de datos.",
    "Finalidad (asignar el lugar y coordinar el beneficio), el teléfono solo para eso, los derechos de acceso, corrección y borrado (Ley 25.326) y qué pasa con los datos si la persona no sigue: se le dan en una planilla y se borran a los 30 días.",
  ],
  [
    "Condiciones generales",
    "Solo decía que no se cambia por dinero ni se transfiere.",
    "Además: no se suma a otras promociones y las bases no se modifican en perjuicio de quien ya tiene su lugar. Si Quvant termina la promo antes, lo anuncia por los mismos medios (art. 7) y respeta los lugares dados.",
  ],
  [
    "Reclamos",
    "No había cláusula.",
    "Nada limita los derechos de la Ley 24.240; los reclamos se pueden hacer ante Quvant o la autoridad de aplicación. No se fija jurisdicción (imponerla al consumidor sería abusivo).",
  ],
  [
    "Publicidad coherente",
    "Lo que dice la publicidad integra el contrato (Ley 24.240, art. 8). La tarjeta y los textos para redes no tenían fechas ni el límite de rubros del mes gratis.",
    "La tarjeta impresa sale con la vigencia («Del … al 31/01/2027») y el límite de rubros, y sin fecha de comienzo se genera como BORRADOR. Los textos para redes llevan las fechas o remiten a las bases.",
  ],
];

const FALTA = [
  "Confirmar que la venta sin conexión funciona igual en el sistema de los clientes, no solo en la demo.",
  "La fecha de comienzo se completa sola el día que se abre la promo desde el panel; ese día hay que generar la tarjeta con --desde.",
];

const ABOGADO = [
  "Si quienes se suman son negocios que usan el servicio para su actividad, ¿se los considera consumidores (Ley 24.240, art. 1)? Las bases se redactaron como si la ley aplicara, que es lo más seguro.",
  "La Disposición 954/2025 (que reemplazó a las resoluciones del botón de baja y del botón de arrepentimiento) alcanza a quien contrata a distancia. Hoy el presupuesto y el abono se aceptan por WhatsApp o email; si algún día se aceptan en la web, el sitio necesita esos botones.",
  "El régimen de Lealtad Comercial (DNU 274/2019) y sus reglamentaciones vigentes sobre promociones: no es un sorteo ni un concurso, pero conviene confirmar que no haga falta informar o registrar nada más.",
  "Si la web tiene que mostrar el enlace a Defensa del Consumidor (Ventanilla Única Federal) según la normativa vigente.",
  "Escribir por WhatsApp a contactos y prospectos: la Ley 26.951 (Registro No Llame) alcanza a la telefonía «en cualquiera de sus modalidades». Los mensajes van de a uno y a conocidos; confirmar si hay que consultar el registro antes de escribir a prospectos del mapa.",
  "La redacción final de la política de privacidad (ya marcada para revisión) y su coherencia con la cláusula 11.",
];

const FUENTES = [
  "Ley 24.240 de Defensa del Consumidor, texto actualizado (argentina.gob.ar/normativa/nacional/638/actualizacion): arts. 7, 8, 10 ter y 37.",
  "Decreto DNU 274/2019, Lealtad Comercial (argentina.gob.ar/normativa/nacional/decreto-274-2019-322236).",
  "Disposición 954/2025 de la Subsecretaría de Defensa del Consumidor y Lealtad Comercial (botón de arrepentimiento y de baja), según análisis de estudios jurídicos; verificar el texto en el Boletín Oficial.",
  "Ley 25.326 de Protección de los Datos Personales y Ley 26.951 (Registro Nacional No Llame).",
  "Jurisprudencia citada en prensa especializada: multas confirmadas por promociones sin fecha de comienzo (Cámara Contencioso Administrativo Federal).",
];

const pagina = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Plex Sans"; src: url("${fuente("IBMPlexSans-Regular.woff2")}"); font-weight: 400; }
@font-face { font-family: "Plex Sans"; src: url("${fuente("IBMPlexSans-SemiBold.woff2")}"); font-weight: 600; }
@font-face { font-family: "Michroma"; src: url("${fuente("Michroma-Regular.ttf")}"); }
@page { size: A4; margin: 18mm 18mm 20mm; }
* { box-sizing: border-box; }
body { font-family: "Plex Sans"; color: #0D0D0F; font-size: 10pt; line-height: 1.5; margin: 0; }
.marca { font-family: "Michroma"; font-size: 9pt; letter-spacing: 0.25em; color: #26262B; }
h1 { font-weight: 600; font-size: 22pt; line-height: 1.1; margin: 6mm 0 2mm; letter-spacing: -0.01em; }
h2 { font-weight: 600; font-size: 13pt; margin: 9mm 0 3mm; page-break-after: avoid; }
.bajada { color: #55555C; font-size: 10.5pt; margin: 0; }
.aviso { border: 1px solid #C9C9CF; border-radius: 3mm; padding: 4mm 5mm; margin-top: 6mm; font-size: 9pt; color: #26262B; background: #F4F4F6; }
ol.bases { padding-left: 6mm; margin: 0; }
ol.bases li { margin-bottom: 3mm; page-break-inside: avoid; }
ol.bases li b { font-weight: 600; }
.hueco { background: #FFF1B8; padding: 0 1mm; border-radius: 1mm; }
table { width: 100%; border-collapse: collapse; font-size: 8.8pt; }
th { text-align: left; font-weight: 600; border-bottom: 1.5px solid #0D0D0F; padding: 2mm 2mm 2mm 0; }
td { vertical-align: top; border-bottom: 1px solid #DCDCE0; padding: 2mm 2mm 2mm 0; }
tr { page-break-inside: avoid; }
td:first-child { font-weight: 600; width: 23%; }
ul { padding-left: 5mm; margin: 0; }
ul li { margin-bottom: 2mm; }
.chico { font-size: 8.5pt; color: #55555C; }
.cuadrado { display: inline-block; width: 2.2mm; height: 2.2mm; background: #7BD389; margin-right: 2mm; vertical-align: 0.2mm; }
</style></head><body>
<div class="marca">QUVANT</div>
<h1><span class="cuadrado"></span>Primeros 100 · Bases y condiciones</h1>
<p class="bajada">Versión revisada el 22 de octubre de 2026. Antes de publicar falta completar los datos marcados en amarillo.</p>
<div class="aviso"><b>Sobre esta revisión.</b> La hizo Claude (un asistente de inteligencia artificial) con criterio jurídico general, a partir del texto de las leyes citadas y de fuentes públicas. No es asesoramiento legal. Por ahora no se va a pasar por un abogado (decisión de Quvant); las dudas que quedan abiertas están en la sección 4, por si más adelante se consulta.</div>

<h2>1. Bases y condiciones (texto propuesto, el mismo de la web)</h2>
<ol class="bases">
${BASES.map((item) => {
  const [titulo, ...resto] = item.split(". ");
  return `<li><b>${html(titulo)}.</b> ${conHuecos(resto.join(". "))}</li>`;
}).join("\n")}
</ol>

<h2>2. Qué cambié y por qué</h2>
<table><thead><tr><th>Punto</th><th>Qué había</th><th>Qué quedó</th></tr></thead><tbody>
${CAMBIOS.map(([punto, antes, despues]) => `<tr><td>${html(punto)}</td><td>${html(antes)}</td><td>${html(despues)}</td></tr>`).join("\n")}
</tbody></table>

<h2>3. Lo que falta completar antes de publicar</h2>
<ul>${FALTA.map((f) => `<li>${html(f)}</li>`).join("")}</ul>

<h2>4. Dudas abiertas (para cuando se consulte a un abogado)</h2>
<ul>${ABOGADO.map((f) => `<li>${html(f)}</li>`).join("")}</ul>

<h2>5. Fuentes consultadas</h2>
<ul class="chico">${FUENTES.map((f) => `<li>${html(f)}</li>`).join("")}</ul>
</body></html>`;

const { chromium } = await import(pathToFileURL(path.join(RAIZ, "video", "node_modules", "playwright", "index.mjs")).href);
const navegador = await chromium.launch({ channel: "chrome" });
const hoja = await navegador.newPage();
await hoja.setContent(pagina, { waitUntil: "load" });
await hoja.evaluate(() => document.fonts.ready);
const destino = path.join(SALIDA, "bases-primeros-100-revisadas.pdf");
await hoja.pdf({
  path: destino,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: '<div style="font-size:7pt;color:#77777E;width:100%;text-align:center;font-family:sans-serif">Primeros 100 · Bases y condiciones · borrador revisado · página <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
  margin: { top: "18mm", bottom: "20mm", left: "18mm", right: "18mm" },
});
// Con --vista, además una imagen de la página entera (para revisar sin abrir el PDF).
if (process.argv.includes("--vista")) {
  await hoja.setViewportSize({ width: 794, height: 1123 });
  await hoja.screenshot({ path: path.join(SALIDA, "bases-primeros-100-vista.png"), fullPage: true });
}
await navegador.close();
console.log("listo", destino);
