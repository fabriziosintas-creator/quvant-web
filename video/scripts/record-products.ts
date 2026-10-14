/**
 * Graba las pantallas reales de Yunque y Forja desde las demos públicas, a
 * 4K (viewport 1920×1080 con deviceScaleFactor 2).
 *
 * Paso 2 del brief: tres cuadros por vista, para revisar antes de grabar
 * las secuencias completas. Los movimientos de cámara (zoom, scroll) se
 * hacen después en Remotion sobre estos cuadros 4K, que es más suave y
 * determinista que capturar 60 fps en tiempo real.
 *
 * Uso: npm run grabar
 * Salida: assets/products/{yunque,forja}/NN-vista-k.png
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "playwright";

const BASE = "https://yunque-rust.vercel.app";
// Se corre desde la carpeta video/ (npm run grabar).
const RAIZ = path.resolve(process.cwd(), "assets", "products");

/** Esconde el aviso "La demo se renovó…" y cualquier otro toast de sistema. */
async function sinAvisos(pagina: Page) {
  await pagina.addStyleTag({
    content: "[data-sonner-toaster], [data-sonner-toast] { display: none !important; }",
  });
  await pagina.evaluate(() => {
    for (const el of document.querySelectorAll("body *")) {
      if (el.children.length === 0 && /La demo se renov/i.test(el.textContent ?? "")) {
        (el.closest("[role=status], li, div") as HTMLElement | null)?.style.setProperty("display", "none");
      }
    }
  });
}

/** Mueve el mouse con pasos, como una mano, hasta el centro del elemento. */
async function acercarMouse(pagina: Page, selector: ReturnType<Page["locator"]>) {
  const caja = await selector.boundingBox();
  if (!caja) return;
  await pagina.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, { steps: 24 });
}

let contador = 0;
async function cuadro(pagina: Page, producto: "yunque" | "forja", nombre: string) {
  contador += 1;
  const carpeta = path.join(RAIZ, producto);
  mkdirSync(carpeta, { recursive: true });
  const archivo = path.join(carpeta, `${String(contador).padStart(2, "0")}-${nombre}.png`);
  await pagina.screenshot({ path: archivo, animations: "allow" });
  console.log("  ", path.relative(RAIZ, archivo));
}

async function yunque(pagina: Page) {
  console.log("Yunque");
  await pagina.goto(`${BASE}/ingresar`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(1500);
  await cuadro(pagina, "yunque", "ingresar-quieto");

  // Diego Sosa, Mostrador de Casa Central: hay tres roles "Mostrador".
  const fila = pagina.locator("div, li").filter({ hasText: "Diego Sosa" }).filter({ has: pagina.getByText("Usar", { exact: true }) }).last();
  const usar = fila.getByText("Usar", { exact: true });
  await acercarMouse(pagina, usar);
  await usar.click();
  await pagina.waitForTimeout(700);
  await cuadro(pagina, "yunque", "ingresar-autocompletado");
  const ingresar = pagina.getByRole("button", { name: "Ingresar" });
  await acercarMouse(pagina, ingresar);
  await cuadro(pagina, "yunque", "ingresar-boton");
  await ingresar.click();
  await pagina.waitForURL(/\/app/, { timeout: 30000 });

  // Tablero
  await pagina.waitForTimeout(4500);
  await sinAvisos(pagina);
  await cuadro(pagina, "yunque", "tablero-arriba");
  await pagina.mouse.wheel(0, 420);
  await pagina.waitForTimeout(900);
  await cuadro(pagina, "yunque", "tablero-medio");
  await pagina.mouse.wheel(0, 700);
  await pagina.waitForTimeout(900);
  await cuadro(pagina, "yunque", "tablero-abajo");

  // Inventario: el filtro "Bajo el mínimo" y la búsqueda "taladro".
  await pagina.goto(`${BASE}/app/inventario`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(2500);
  await sinAvisos(pagina);
  await cuadro(pagina, "yunque", "inventario");
  const filtro = pagina.getByRole("button", { name: /Bajo el mínimo/ }).first();
  await acercarMouse(pagina, filtro);
  await filtro.click();
  await pagina.waitForTimeout(1200);
  await cuadro(pagina, "yunque", "inventario-bajo-minimo");
  const buscador = pagina.getByLabel("Buscar producto");
  await buscador.click();
  await buscador.pressSequentially("taladro", { delay: 60 });
  await pagina.waitForTimeout(1500);
  await cuadro(pagina, "yunque", "inventario-taladro");

  // Mostrador
  await pagina.goto(`${BASE}/app/mostrador`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(2500);
  await sinAvisos(pagina);
  await cuadro(pagina, "yunque", "mostrador");
  const buscaProducto = pagina.getByLabel("Buscar producto");
  await buscaProducto.click();
  await buscaProducto.pressSequentially("taladro", { delay: 60 });
  await pagina.waitForTimeout(1500);
  await cuadro(pagina, "yunque", "mostrador-busqueda");
  await pagina.keyboard.press("Enter");
  await pagina.waitForTimeout(1500);
  await cuadro(pagina, "yunque", "mostrador-carrito");

  // Servicio técnico vive en /app/servicio (no en /app/servicio-tecnico).
  await pagina.goto(`${BASE}/app/servicio`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(2500);
  await sinAvisos(pagina);
  await cuadro(pagina, "yunque", "servicio-tecnico");
}

async function forja(pagina: Page) {
  console.log("Forja");
  await pagina.goto(`${BASE}/forja`, { waitUntil: "networkidle" });
  // La intro (yunque + forja) tarda en armarse: tres cuadros mientras crece.
  for (const [segundos, nombre] of [[5, "intro-armandose"], [7, "intro-chispas"], [9, "intro-completa"]] as const) {
    await pagina.waitForTimeout(segundos === 5 ? 5000 : 2000);
    await cuadro(pagina, "forja", nombre);
  }
  const saltar = pagina.getByRole("button", { name: "Saltar" });
  if (await saltar.isVisible().catch(() => false)) await saltar.click();
  await pagina.waitForTimeout(3500);
  await sinAvisos(pagina);
  await cuadro(pagina, "forja", "mapa");
  await pagina.getByRole("button", { name: "1200×" }).click().catch(() => {});
  await pagina.waitForTimeout(4000);
  await cuadro(pagina, "forja", "mapa-1200x");

  // La vista 3D: si el navegador sin pantalla no crea el lienzo WebGL, no
  // se guarda nada (un cuadro igual a la constelación sería mentira).
  await pagina.getByRole("button", { name: "3D", exact: true }).click().catch(() => {});
  await pagina.waitForTimeout(7000);
  if ((await pagina.locator("canvas").count()) > 0) {
    await cuadro(pagina, "forja", "vista-3d");
  } else {
    console.log("   (la vista 3D no dibuja en Chromium sin pantalla: sin lienzo WebGL; no se graba)");
  }
  await pagina.getByRole("button", { name: "2D", exact: true }).click().catch(() => {});

  await pagina.getByRole("button", { name: "Constelación", exact: true }).click();
  await pagina.waitForTimeout(3500);
  await cuadro(pagina, "forja", "constelacion");

  // La sucursal por dentro: un clic en Casa Central desde la constelación.
  const casaCentral = pagina.getByRole("button", { name: /^Casa Central/ }).first();
  await acercarMouse(pagina, casaCentral);
  await casaCentral.click();
  await pagina.waitForTimeout(3500);
  await cuadro(pagina, "forja", "sucursal-planta");
  await pagina.mouse.move(700, 330, { steps: 30 });
  await pagina.waitForTimeout(1200);
  await cuadro(pagina, "forja", "sucursal-estanterias");
  await pagina.mouse.move(1330, 300, { steps: 30 });
  await pagina.waitForTimeout(1200);
  await cuadro(pagina, "forja", "sucursal-servicio-tecnico");

  await pagina.getByRole("button", { name: "Red" }).click().catch(() => {});
  await pagina.waitForTimeout(2000);
  await pagina.getByRole("button", { name: "Sala de control", exact: true }).click();
  await pagina.waitForTimeout(4000);
  await cuadro(pagina, "forja", "sala-de-control");
}

async function main() {
  const navegador = await chromium.launch();
  try {
    const contexto = await navegador.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
      colorScheme: "dark",
    });
    const pagina = await contexto.newPage();
    const primeraLinea = (e: Error) => e.message.split("\n")[0];
    const solo = process.argv[2];
    if (!solo || solo === "yunque") {
      await yunque(pagina).catch((e) => console.log("ERROR en Yunque:", primeraLinea(e)));
    }
    contador = 0;
    if (!solo || solo === "forja") {
      await forja(pagina).catch((e) => console.log("ERROR en Forja:", primeraLinea(e)));
    }
  } finally {
    await navegador.close();
  }
}

void main();
