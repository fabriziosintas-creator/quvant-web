/**
 * Graba en video el recorrido real por Forja (demo pública) para la web y
 * el spot: la red con todas las sucursales, la constelación, la entrada a
 * Casa Central, las estanterías con faltantes, la sucursal en 3D y la sala
 * de control.
 *
 * - Usa el Chrome instalado sin ventana: dibuja con la GPU real (D3D11) a
 *   60 fps. El Chromium de Playwright cae en SwiftShader y el 3D va a 4 fps.
 * - Filma con el screencast de DevTools (JPEG por cuadro, con su hora) y
 *   después arma un MP4 a 30 fps constantes con ffmpeg.
 * - Inyecta un cursor visible (el punto cuadrado de la marca) para que se
 *   vea que alguien está usando el sistema.
 * - Anota en marcas.json en qué segundo empieza cada momento, para editar
 *   en Remotion sin adivinar.
 *
 * Uso: npm run grabar-forja
 * Salida: assets/products/forja-video/{forja-recorrido.mp4, marcas.json}
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "playwright";

const URL = "https://yunque-rust.vercel.app/forja";
const RAIZ = process.cwd();
const SALIDA = path.join(RAIZ, "assets", "products", "forja-video");
const CUADROS = path.join(SALIDA, "cuadros");
const FFMPEG = path.join(RAIZ, "node_modules", "ffmpeg-static", "ffmpeg.exe");
// 1600×1000 (16:10, el formato de la ventana de la web): a 1920 el JPEG por
// cuadro frenaba la captura.
const ANCHO = 1600;
const ALTO = 1000;

const marcas: Array<{ momento: string; hora: number }> = [];
/** La trayectoria del mouse, con hora: Remotion dibuja el cursor suave a partir de esto. */
const trayectoria: Array<{ hora: number; x: number; y: number; apretado: boolean }> = [];
let mouse = { x: 800, y: 500, apretado: false };
const anotar = () => trayectoria.push({ hora: Date.now() / 1000, ...mouse });
const marcar = (momento: string) => {
  marcas.push({ momento, hora: Date.now() / 1000 });
  console.log("  ·", momento);
};

/** Mueve el mouse como una mano (con aceleración y frenado), anotando cada paso. */
async function ir(pagina: Page, x: number, y: number, pasos = 28, pausa = 250) {
  const desde = { ...mouse };
  for (let i = 1; i <= pasos; i++) {
    const t = i / pasos;
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    mouse = { ...mouse, x: desde.x + (x - desde.x) * e, y: desde.y + (y - desde.y) * e };
    await pagina.mouse.move(mouse.x, mouse.y);
    anotar();
  }
  await pagina.waitForTimeout(pausa);
  anotar();
}

async function irA(pagina: Page, selector: ReturnType<Page["locator"]>, pasos = 28) {
  // Si un control no aparece, se anota y se sigue: mejor un momento menos que perder la toma.
  const caja = await selector.boundingBox({ timeout: 4000 }).catch(() => null);
  if (!caja) {
    console.log("    (no encontré:", String(selector).slice(0, 90) + ")");
    return false;
  }
  await ir(pagina, caja.x + caja.width / 2, caja.y + caja.height / 2, pasos);
  return true;
}

async function clic(pagina: Page, selector: ReturnType<Page["locator"]>) {
  if (!(await irA(pagina, selector))) return false;
  await pagina.mouse.down();
  mouse = { ...mouse, apretado: true };
  anotar();
  await pagina.waitForTimeout(110);
  await pagina.mouse.up();
  mouse = { ...mouse, apretado: false };
  anotar();
  return true;
}

/** Un control por su texto visible (no todos son <button> con ese nombre exacto). */
const control = (pagina: Page, texto: RegExp) =>
  pagina.locator("button, a, [role=button], [role=tab]").filter({ hasText: texto }).first();

/** Dónde está la etiqueta de un rack (AD, BF, SE…) en la planta 2D. */
async function posicionRack(pagina: Page, codigo: string) {
  return pagina.evaluate((c) => {
    const el = [...document.querySelectorAll("body *")].find(
      (e) => e.children.length === 0 && e.textContent?.trim() === c,
    ) as HTMLElement | undefined;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + 60, y: r.top - 28 };
  }, codigo);
}

async function recorrido(pagina: Page) {
  await pagina.goto(URL, { waitUntil: "networkidle" });
  marcar("intro");
  await pagina.waitForTimeout(6500);
  await clic(pagina, pagina.getByRole("button", { name: "Saltar" }));
  await pagina.waitForTimeout(1800);

  // 1 · La red: todas las sucursales, a 1200× para que respire.
  marcar("red");
  await clic(pagina, pagina.getByRole("button", { name: "1200×" }));
  await pagina.waitForTimeout(800);
  for (const nombre of [/^Salón y depósito/, /^Sucursal Norte/, /^Casa Central/]) {
    await irA(pagina, pagina.getByRole("button", { name: nombre }).first(), 34);
    await pagina.waitForTimeout(700);
  }
  await pagina.waitForTimeout(1200);

  // 2 · La constelación.
  marcar("constelacion");
  await clic(pagina, pagina.getByRole("button", { name: "Constelación", exact: true }));
  await pagina.waitForTimeout(2600);

  // 3 · Entrar a Casa Central: con la GPU real abre en 3D.
  marcar("entrar");
  await clic(pagina, pagina.getByRole("button", { name: /^Casa Central/ }).first());
  await pagina.waitForTimeout(2200);

  // 4 · La sucursal en 3D. (El arrastre no orbita en esta demo: la
  // órbita se hace en la edición.)
  marcar("3d");
  await ir(pagina, 640, 500, 40, 900);
  await ir(pagina, 1000, 470, 40, 900);

  // 5 · Lo que falta: los racks con cajas en ámbar (en el mínimo) y rojo
  // (sin stock), con el detalle de cada uno al pasar.
  marcar("faltantes");
  for (const rack of ["BF", "SE", "SI", "EL", "HE"]) {
    const p = await posicionRack(pagina, rack);
    if (!p) continue;
    await ir(pagina, p.x, p.y, 34, 1500);
  }
  marcar("deposito");
  await clic(pagina, control(pagina, /Depósito\s*\d+\s*críticos/));
  await pagina.waitForTimeout(2200);

  // 6 · La sala de control.
  await clic(pagina, control(pagina, /^\W*Red$/));
  await pagina.waitForTimeout(900);
  marcar("sala");
  await clic(pagina, pagina.getByRole("button", { name: "Sala de control", exact: true }));
  await pagina.waitForTimeout(4500);
  marcar("fin");
}

async function main() {
  rmSync(CUADROS, { recursive: true, force: true });
  mkdirSync(CUADROS, { recursive: true });

  // El Chrome instalado: sin ventana pero con la GPU real.
  const navegador = await chromium.launch({ channel: "chrome", args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
  const contexto = await navegador.newContext({ viewport: { width: ANCHO, height: ALTO }, colorScheme: "dark" });
  const pagina = await contexto.newPage();
  const cdp = await contexto.newCDPSession(pagina);

  // El cuadro se confirma al instante y se guarda en memoria: escribir al
  // disco antes de pedir el siguiente bajaba la captura a ~10 por segundo.
  const enMemoria: Array<{ datos: string; hora: number }> = [];
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    void cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    enMemoria.push({ datos: data, hora: metadata.timestamp ?? Date.now() / 1000 });
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 82, maxWidth: ANCHO, maxHeight: ALTO, everyNthFrame: 1 });

  try {
    await recorrido(pagina);
  } catch (error) {
    console.log("ERROR en el recorrido:", (error as Error).message.split("\n")[0]);
  } finally {
    await cdp.send("Page.stopScreencast").catch(() => {});
    await navegador.close();
  }

  const cuadros = enMemoria.map((c, i) => {
    const archivo = path.join(CUADROS, `${String(i).padStart(5, "0")}.jpg`);
    writeFileSync(archivo, Buffer.from(c.datos, "base64"));
    return { archivo, hora: c.hora };
  });
  if (cuadros.length < 2) throw new Error("no se grabó ningún cuadro");
  const inicio = cuadros[0].hora;
  const total = cuadros[cuadros.length - 1].hora - inicio;
  console.log(`\n${cuadros.length} cuadros en ${total.toFixed(1)} s (${(cuadros.length / total).toFixed(1)} por segundo de promedio)`);

  // Cada cuadro dura hasta el siguiente: el screencast solo manda cuando algo cambia.
  const lista = cuadros
    .map((c, i) => {
      const siguiente = cuadros[i + 1]?.hora ?? c.hora + 1 / 30;
      return `file '${c.archivo.replace(/\\/g, "/")}'\nduration ${Math.max(0.001, siguiente - c.hora).toFixed(4)}`;
    })
    .join("\n");
  const archivoLista = path.join(SALIDA, "cuadros.txt");
  writeFileSync(archivoLista, `${lista}\nfile '${cuadros[cuadros.length - 1].archivo.replace(/\\/g, "/")}'\n`);
  execFileSync(
    FFMPEG,
    [
      "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", archivoLista,
      "-vf", `fps=30,scale=${ANCHO}:${ALTO}:flags=lanczos`, "-c:v", "libx264", "-preset", "slow",
      "-crf", "15", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
      path.join(SALIDA, "forja-recorrido.mp4"),
    ],
    { stdio: "inherit" },
  );
  writeFileSync(
    path.join(SALIDA, "cursor.json"),
    JSON.stringify(
      trayectoria.map((p) => ({ s: Number((p.hora - inicio).toFixed(3)), x: Math.round(p.x), y: Math.round(p.y), a: p.apretado })),
    ),
  );
  writeFileSync(
    path.join(SALIDA, "marcas.json"),
    JSON.stringify(
      marcas.map((m) => ({ momento: m.momento, segundo: Number((m.hora - inicio).toFixed(2)) })),
      null,
      2,
    ),
  );
  console.log("listo: assets/products/forja-video/forja-recorrido.mp4 + marcas.json");
}

void main();
