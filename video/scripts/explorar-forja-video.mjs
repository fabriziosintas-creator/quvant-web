/**
 * Antes de grabar el recorrido de Forja en video: qué motor WebGL usa cada
 * modo de Chromium (GPU real o SwiftShader por software), a cuántos
 * cuadros por segundo dibuja la sucursal en 3D, y qué controles tiene la
 * sucursal por dentro.
 */
import { chromium } from "playwright";

const URL = "https://yunque-rust.vercel.app/forja";

async function probar(nombre, opciones) {
  const navegador = await chromium.launch(opciones);
  const pagina = await navegador.newPage({ viewport: { width: 1920, height: 1200 }, colorScheme: "dark" });
  const motor = await pagina.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return "sin WebGL2";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "desconocido";
  });
  await pagina.goto(URL, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(3000);
  await pagina.getByRole("button", { name: "Saltar" }).click().catch(() => {});
  await pagina.waitForTimeout(2500);
  // Entrar a Casa Central desde la constelación y pasar a 3D.
  await pagina.getByRole("button", { name: "Constelación", exact: true }).click();
  await pagina.waitForTimeout(2500);
  await pagina.getByRole("button", { name: /^Casa Central/ }).first().click();
  await pagina.waitForTimeout(3000);
  const controles = await pagina.evaluate(() =>
    [...new Set([...document.querySelectorAll("button, a, [role=button]")]
      .filter((e) => e.offsetParent !== null)
      .map((e) => (e.innerText || e.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 60))
      .filter(Boolean))],
  );
  const tresD = pagina.getByRole("button", { name: /^3D$/ });
  const hay3D = await tresD.isVisible().catch(() => false);
  if (hay3D) await tresD.click();
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
  console.log(`\n== ${nombre}\nmotor WebGL: ${motor}\nfps en la sucursal 3D: ${fps}\nbotón 3D en la sucursal: ${hay3D ? "sí" : "no"}\ncanvas: ${await pagina.locator("canvas").count()}`);
  if (nombre.startsWith("A")) console.log("controles en la sucursal:", controles.join(" | "));
  await navegador.close();
}

await probar("A · headless de Playwright (por defecto)", {});
await probar("B · headless nuevo con GPU (d3d11)", {
  channel: "chromium",
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-webgpu"],
});
