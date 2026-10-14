/** Reconocimiento de Forja: qué hay en cada modo y cómo se entra a una sucursal por dentro. */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const SALIDA = process.argv[2] ?? "out/exploracion-forja";
mkdirSync(SALIDA, { recursive: true });
const navegador = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const pagina = await navegador.newPage({ viewport: { width: 1920, height: 1080 }, colorScheme: "dark" });
const errores = [];
pagina.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200)));

const botones = () =>
  pagina.evaluate(() =>
    [...new Set([...document.querySelectorAll("button, a, [role=button], [role=tab]")]
      .filter((e) => e.offsetParent !== null)
      .map((e) => (e.innerText || e.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 80))
      .filter(Boolean))].join(" | "),
  );

await pagina.goto("https://yunque-rust.vercel.app/forja", { waitUntil: "networkidle" });
for (const s of [3, 6, 9]) {
  await pagina.waitForTimeout(3000);
  await pagina.screenshot({ path: `${SALIDA}/intro-${s}s.png` });
}
console.log("canvas en la intro:", await pagina.locator("canvas").count());
await pagina.getByRole("button", { name: "Saltar" }).click().catch(() => console.log("(sin Saltar)"));
await pagina.waitForTimeout(3000);

await pagina.getByRole("button", { name: "3D", exact: true }).click();
await pagina.waitForTimeout(7000);
await pagina.screenshot({ path: `${SALIDA}/modo-3d.png` });
console.log("\n3D · canvas:", await pagina.locator("canvas").count(), "· url:", new URL(pagina.url()).pathname + new URL(pagina.url()).search);
console.log("3D · botones:", await botones());

await pagina.getByRole("button", { name: "Constelación", exact: true }).click();
await pagina.waitForTimeout(3000);
const nodo = pagina.getByRole("button", { name: /^Casa Central/ }).first();
await nodo.click();
await pagina.waitForTimeout(2500);
console.log("\nconstelación + clic en Casa Central · botones:", await botones());
await nodo.dblclick().catch(() => {});
await pagina.waitForTimeout(3500);
await pagina.screenshot({ path: `${SALIDA}/doble-clic-casa-central.png` });
console.log("\ndoble clic · url:", new URL(pagina.url()).pathname + new URL(pagina.url()).search);
console.log("doble clic · botones:", await botones());
console.log("\nerrores de consola:", errores.length ? errores.slice(0, 5).join("\n  ") : "(ninguno)");
await navegador.close();
