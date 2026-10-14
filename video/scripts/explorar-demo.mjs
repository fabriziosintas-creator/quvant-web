/**
 * Reconocimiento de la demo antes de grabar: entra a cada vista, guarda una
 * captura chica y lista los botones y textos visibles, para que el
 * grabador use selectores que existen de verdad.
 *
 * Uso: node scripts/explorar-demo.mjs <carpeta-de-salida>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const SALIDA = process.argv[2] ?? "out/exploracion";
const BASE = "https://yunque-rust.vercel.app";
mkdirSync(SALIDA, { recursive: true });

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  colorScheme: "dark",
});
const pagina = await contexto.newPage();
const informe = [];

async function relevar(nombre) {
  await pagina.waitForTimeout(4500);
  await pagina.screenshot({ path: `${SALIDA}/${nombre}.png` });
  const datos = await pagina.evaluate(() => {
    const visibles = (sel) =>
      [...document.querySelectorAll(sel)]
        .filter((e) => e.offsetParent !== null)
        .map((e) => (e.innerText || e.getAttribute("aria-label") || "").trim().replace(/\s+/g, " "))
        .filter(Boolean);
    return {
      url: location.pathname,
      titulo: document.title,
      botones: [...new Set(visibles("button, a[role=button], [role=tab]"))].slice(0, 40),
      enlaces: [...new Set(visibles("a"))].slice(0, 30),
      encabezados: visibles("h1, h2, h3").slice(0, 15),
      dialogos: visibles("[role=dialog], [role=alertdialog], [role=status], [data-sonner-toast]"),
    };
  });
  informe.push({ nombre, ...datos });
  console.log(`\n== ${nombre} (${datos.url})`);
  console.log("encabezados:", datos.encabezados.join(" | "));
  console.log("botones:", datos.botones.join(" | "));
  if (datos.dialogos.length) console.log("DIALOGOS/TOASTS:", datos.dialogos.join(" | "));
}

try {
  await pagina.goto(`${BASE}/ingresar`, { waitUntil: "networkidle" });
  await relevar("01-ingresar");

  // El rol Mostrador: el botón "Usar" de su fila autocompleta el ingreso.
  const filaMostrador = pagina.locator("li, tr, div").filter({ hasText: /Mostrador/ }).filter({ has: pagina.getByRole("button", { name: /Usar/i }) }).last();
  if (await filaMostrador.count()) {
    await filaMostrador.getByRole("button", { name: /Usar/i }).first().click();
    await pagina.waitForTimeout(800);
    await pagina.getByRole("button", { name: /Ingresar/i }).first().click();
    await pagina.waitForURL(/\/app/, { timeout: 30000 }).catch(() => {});
    await relevar("02-tablero");
    for (const ruta of ["inventario", "mostrador", "presupuestos", "servicio-tecnico", "entregas"]) {
      await pagina.goto(`${BASE}/app/${ruta}`, { waitUntil: "networkidle" }).catch(() => {});
      await relevar(`03-${ruta}`);
    }
  } else {
    console.log("NO encontré la fila del rol Mostrador con botón Usar");
  }

  await pagina.goto(`${BASE}/forja`, { waitUntil: "networkidle" });
  await relevar("10-forja");
} catch (error) {
  console.log("ERROR:", error.message);
} finally {
  writeFileSync(`${SALIDA}/informe.json`, JSON.stringify(informe, null, 2));
  await navegador.close();
}
