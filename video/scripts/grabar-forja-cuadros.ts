/**
 * Graba el recorrido real por Forja (demo pública) CUADRO POR CUADRO, a
 * 60 fps exactos, para la ventana de Forja de la web.
 *
 * Por qué así y no en vivo: la toma anterior se filmó en tiempo real desde
 * una notebook y, cada vez que la máquina no llegaba a dibujar el 3D, el
 * video se trababa (y al acelerarlo en la edición, más). Acá la página
 * corre con un reloj virtual (reloj-virtual.js): el tiempo solo avanza
 * cuando lo pide el grabador, cada cuadro se dibuja entero con la GPU y
 * recién ahí se fotografía. El resultado es fluido aunque un cuadro tarde
 * lo que tarde.
 *
 * El guion (abajo) mueve el mouse como una mano, con aceleración y
 * frenado, y anota todo en segundos del video: cursor.json (Remotion
 * dibuja el cursor encima) y marcas.json (dónde empieza cada momento).
 *
 * Uso: npm run grabar-forja
 * Salida: public/forja/recorrido.mp4 (todo intra, para que Remotion lo
 * recorra cuadro por cuadro) + src/compositions/forja/{cursor,marcas}.json
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type CDPSession, type Locator, type Page } from "playwright";

const URL = "https://yunque-rust.vercel.app/forja";
const RAIZ = process.cwd();
const CUADROS = path.join(RAIZ, "out", "forja-cuadros");
const SALIDA_VIDEO = path.join(RAIZ, "public", "forja", "recorrido.mp4");
const SALIDA_DATOS = path.join(RAIZ, "src", "compositions", "forja");
const FFMPEG = path.join(RAIZ, "node_modules", "ffmpeg-static", "ffmpeg.exe");
export const FPS_TOMA = 60;
const ANCHO = 1600;
const ALTO = 1000;
const PASO = 1000 / FPS_TOMA;

let pagina: Page;
let cdp: CDPSession;
let cuadro = 0;
const escrituras: Promise<void>[] = [];
let mouse = { x: ANCHO * 0.62, y: ALTO * 0.6, apretado: false, visible: false };
const trayectoria: Array<{ s: number; x: number; y: number; a: boolean }> = [];
const marcas: Array<{ momento: string; segundo: number }> = [];

const segundo = () => Number((cuadro / FPS_TOMA).toFixed(4));

/** Un cuadro: avanza el reloj de la página, lo dibuja y lo fotografía. */
async function filmar() {
  await pagina.evaluate((dt) => (window as unknown as { __avanzar: (ms: number) => Promise<void> }).__avanzar(dt), PASO);
  const { data } = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 94, optimizeForSpeed: true });
  const archivo = path.join(CUADROS, `${String(cuadro).padStart(5, "0")}.jpg`);
  escrituras.push(writeFile(archivo, Buffer.from(data, "base64")));
  if (mouse.visible) trayectoria.push({ s: segundo(), x: Math.round(mouse.x * 10) / 10, y: Math.round(mouse.y * 10) / 10, a: mouse.apretado });
  cuadro++;
  if (cuadro % 300 === 0) console.log(`  ${cuadro} cuadros (${(cuadro / FPS_TOMA).toFixed(0)} s)`);
}

async function esperar(segundos: number) {
  const n = Math.round(segundos * FPS_TOMA);
  for (let i = 0; i < n; i++) await filmar();
}

const marcar = (momento: string) => {
  marcas.push({ momento, segundo: segundo() });
  console.log("  ·", momento, segundo().toFixed(2), "s");
};

/** La curva de la mano: arranca y frena suave (la misma que el resto del spot). */
const curva = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Lleva el mouse a (x, y) en `segundos`, un cuadro por paso. */
async function mover(x: number, y: number, segundos = 0.9) {
  mouse.visible = true;
  const desde = { x: mouse.x, y: mouse.y };
  const n = Math.max(1, Math.round(segundos * FPS_TOMA));
  for (let i = 1; i <= n; i++) {
    const e = curva(i / n);
    mouse.x = desde.x + (x - desde.x) * e;
    mouse.y = desde.y + (y - desde.y) * e;
    await pagina.mouse.move(mouse.x, mouse.y);
    await filmar();
  }
}

async function centro(control: Locator) {
  const caja = await control.boundingBox({ timeout: 4000 }).catch(() => null);
  if (!caja) {
    console.log("    (no encontré:", String(control).slice(0, 100) + ")");
    return null;
  }
  return { x: caja.x + caja.width / 2, y: caja.y + caja.height / 2 };
}

async function irA(control: Locator, segundos = 0.9) {
  const punto = await centro(control);
  if (!punto) return false;
  await mover(punto.x, punto.y, segundos);
  return true;
}

async function clic(control: Locator, segundos = 0.9) {
  if (!(await irA(control, segundos))) return false;
  await esperar(0.12);
  await pagina.mouse.down();
  mouse.apretado = true;
  await esperar(0.1);
  await pagina.mouse.up();
  mouse.apretado = false;
  return true;
}

/** Dónde está el rótulo de un rack (AD, BF, SE…) en la sucursal. */
async function rack(codigo: string) {
  return pagina.evaluate((c) => {
    const el = [...document.querySelectorAll("body *")].find(
      (e) => e.children.length === 0 && e.textContent?.trim() === c,
    ) as HTMLElement | undefined;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + 60, y: r.top - 28 };
  }, codigo);
}

const control = (texto: RegExp) =>
  pagina.locator("button, a, [role=button], [role=tab]").filter({ hasText: texto }).first();

/** Aprieta un control sin que se vea (sin mover el cursor de la toma). */
async function apretarSinVer(control: Locator) {
  await control.evaluate((el) => (el as HTMLElement).click()).catch(() => console.log("    (no encontré:", String(control).slice(0, 80) + ")"));
}

/** El guion de la toma, en tiempo del video. */
async function guion() {
  // Los botones de la intro ("Saltar", "Sin sonido") no van en la toma. La
  // intro los crea después de cargar: se esconden apenas aparecen.
  await pagina.addStyleTag({ content: "[data-oculto-en-toma] { visibility: hidden !important; }" });
  // (Como texto: tsx le agrega a las funciones con nombre un ayudante que en la página no existe.)
  await pagina.evaluate(`(() => {
    const esconder = () => {
      for (const boton of document.querySelectorAll("button:not([data-oculto-en-toma])")) {
        if (/saltar|sonido/i.test(boton.innerText)) boton.setAttribute("data-oculto-en-toma", "");
      }
    };
    esconder();
    new MutationObserver(esconder).observe(document.body, { childList: true, subtree: true, characterData: true });
  })()`);

  // 0 · La fragua: la intro de la demo, entera (cae el yunque, chispas,
  // la campana, la marca y la cámara entra al fuego hasta el mapa).
  marcar("fragua");
  await esperar(6.2);
  // La simulación del día a 1200× (el tránsito entre sucursales se mueve).
  await apretarSinVer(pagina.getByRole("button", { name: "1200×" }));
  await esperar(0.8);

  // 1 · La red: el mapa con las tres sucursales; al pasar, el resumen de cada una.
  marcar("red");
  for (const nombre of [/^Salón y depósito/, /^Sucursal Norte/, /^Casa Central/]) {
    await irA(pagina.getByRole("button", { name: nombre }).first(), 0.85);
    await esperar(0.75);
  }

  // 2 · La constelación y la entrada a Casa Central (la cámara vuela adentro).
  marcar("entrar");
  await clic(pagina.getByRole("button", { name: "Constelación", exact: true }), 0.9);
  await esperar(1.3);
  await clic(pagina.getByRole("button", { name: /^Casa Central/ }).first(), 0.9);
  await esperar(2.6);

  // 3 · Rack por rack: el detalle de cada uno al pasar (en ámbar, lo que está en el mínimo).
  marcar("racks");
  for (const codigo of ["BF", "SE", "HE"]) {
    const p = await rack(codigo);
    if (!p) continue;
    await mover(p.x, p.y, 0.8);
    await esperar(1.15);
  }

  // 4 · Los críticos: el panel del depósito con todo lo que hay que reponer.
  marcar("criticos");
  await clic(control(/Depósito\s*\d+\s*críticos/), 0.9);
  await esperar(1.1);
  const lista = await centro(control(/^EA-E|^AD-B/));
  if (lista) {
    await mover(lista.x, lista.y, 0.8);
    await mover(lista.x, lista.y + 220, 1.6);
  }
  await esperar(0.5);

  // 5 · De vuelta a la red y la sala de control: toda la red en una pantalla.
  marcar("vuelta");
  await clic(control(/^\W*Red$/), 0.9);
  await esperar(0.9);
  await irA(pagina.getByRole("button", { name: "Sala de control", exact: true }), 0.9);
  marcar("sala");
  await clic(pagina.getByRole("button", { name: "Sala de control", exact: true }), 0.15);
  await esperar(0.5);
  mouse.visible = false;
  await esperar(4.8);
  marcar("fin");
}

async function main() {
  rmSync(CUADROS, { recursive: true, force: true });
  mkdirSync(CUADROS, { recursive: true });
  mkdirSync(path.dirname(SALIDA_VIDEO), { recursive: true });

  // El Chrome instalado, sin ventana pero con la GPU real.
  const navegador = await chromium.launch({ channel: "chrome", args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
  const contexto = await navegador.newContext({ viewport: { width: ANCHO, height: ALTO }, colorScheme: "dark" });
  await contexto.addInitScript({ path: path.join(RAIZ, "scripts", "reloj-virtual.js") });
  pagina = await contexto.newPage();
  pagina.on("pageerror", (error) => console.log("  [página]", error.message.slice(0, 120)));
  cdp = await contexto.newCDPSession(pagina);

  const inicio = Date.now();
  try {
    await pagina.goto(URL, { waitUntil: "networkidle" });
    await guion();
  } finally {
    await navegador.close();
  }
  await Promise.all(escrituras);
  console.log(`\n${cuadro} cuadros (${(cuadro / FPS_TOMA).toFixed(1)} s de video) en ${((Date.now() - inicio) / 1000).toFixed(0)} s reales`);

  // Todo intra (-g 1): Remotion salta a cualquier cuadro sin decodificar desde atrás.
  execFileSync(
    FFMPEG,
    [
      "-y", "-loglevel", "error", "-framerate", String(FPS_TOMA), "-i", path.join(CUADROS, "%05d.jpg"),
      "-c:v", "libx264", "-preset", "medium", "-crf", "12", "-g", "1", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", SALIDA_VIDEO,
    ],
    { stdio: "inherit" },
  );
  mkdirSync(SALIDA_DATOS, { recursive: true });
  writeFileSync(path.join(SALIDA_DATOS, "cursor.json"), JSON.stringify(trayectoria));
  writeFileSync(path.join(SALIDA_DATOS, "marcas.json"), JSON.stringify(marcas, null, 2));
  console.log("listo:", path.relative(RAIZ, SALIDA_VIDEO), "+ cursor.json + marcas.json");
}

void main();
