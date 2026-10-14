/** Busca una forma de lanzar Chromium con la GPU real, midiendo los fps de la sucursal en 3D. */
import { chromium } from "playwright";

const URL = "https://yunque-rust.vercel.app/forja";

async function probar(nombre, opciones) {
  let navegador;
  try {
    navegador = await chromium.launch(opciones);
    const pagina = await navegador.newPage({ viewport: { width: 1920, height: 1200 }, colorScheme: "dark" });
    const motor = await pagina.evaluate(() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      const info = gl?.getExtension("WEBGL_debug_renderer_info");
      return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "sin WebGL2";
    });
    await pagina.goto(URL, { waitUntil: "networkidle" });
    await pagina.waitForTimeout(2500);
    await pagina.getByRole("button", { name: "Saltar" }).click().catch(() => {});
    await pagina.waitForTimeout(2000);
    await pagina.getByRole("button", { name: "3D", exact: true }).click().catch(() => {});
    await pagina.getByRole("button", { name: "Constelación", exact: true }).click();
    await pagina.waitForTimeout(2000);
    await pagina.getByRole("button", { name: /^Casa Central/ }).first().click();
    await pagina.waitForTimeout(4000);
    const fps = await pagina.evaluate(
      () =>
        new Promise((ok) => {
          let n = 0;
          const t0 = performance.now();
          const paso = () => {
            n++;
            if (performance.now() - t0 < 3000) requestAnimationFrame(paso);
            else ok(Math.round((n / (performance.now() - t0)) * 1000));
          };
          requestAnimationFrame(paso);
        }),
    );
    console.log(`${nombre}\n   motor: ${motor.slice(0, 90)}\n   fps sucursal 3D: ${fps}`);
  } catch (error) {
    console.log(`${nombre}\n   FALLÓ: ${error.message.split("\n")[0].slice(0, 120)}`);
  } finally {
    await navegador?.close().catch(() => {});
  }
}

const fueraDePantalla = ["--window-position=-3000,0", "--window-size=1920,1200"];
await probar("1 · Chrome instalado, headless", { channel: "chrome" });
await probar("2 · Chrome instalado, headless + d3d11", { channel: "chrome", args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
await probar("3 · Chromium con ventana fuera de pantalla", { headless: false, args: fueraDePantalla });
