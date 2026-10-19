/**
 * npm run preparar-spot-2026
 *
 * Junta el material del spot 2026 en public/spot2026/ (lo usa Remotion con
 * staticFile). Todo sale del sitio, nada de stock:
 *  - Las capturas de los trabajos (../public/webs): Grimm, Yunque, HackFit,
 *    Firmamento, Gene Keys y las portadas de todos para la pared.
 *  - Las fotos del método (../public/objetivo).
 *  - 2,2 s del recorrido real de Forja (los racks del depósito en 3D), en
 *    cuadros JPEG a 30 fps: remotion.exe está bloqueado en esta máquina y
 *    no se puede usar OffthreadVideo.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const WEB = path.resolve("..", "public");
const DESTINO = path.resolve("public", "spot2026");
mkdirSync(DESTINO, { recursive: true });

const ARCHIVOS = [
  "webs/grimm/inicio-escritorio-1.webp",
  "webs/grimm/inicio-celular-1.webp",
  "webs/yunque/sistema-escritorio-1.webp",
  "webs/yunque/sitio-celular-1.webp",
  "webs/yunque/sitio-escritorio-1.webp",
  "webs/hackfit/inicio-celular-1.webp",
  "webs/hackfit/inicio-portada-celular.webp",
  "webs/firmamento/inicio-escritorio-1.webp",
  "webs/firmamento/inicio-celular-1.webp",
  "webs/gene-keys/inicio-escritorio-1.webp",
  "webs/gene-keys/inicio-celular-1.webp",
  "webs/millonarios/inicio-portada.webp",
  "webs/ideario/inicio-portada.webp",
  "webs/forja/red-portada.webp",
  "webs/grimm/inicio-portada.webp",
  "webs/yunque/sitio-portada.webp",
  "webs/yunque/sistema-portada.webp",
  "webs/firmamento/inicio-portada.webp",
  "webs/gene-keys/inicio-portada.webp",
  "webs/hackfit/inicio-portada.webp",
  "objetivo/escuchar.webp",
  "objetivo/sonar.webp",
  "objetivo/bajar.webp",
  "objetivo/construir.webp",
];

for (const archivo of ARCHIVOS) {
  const nombre = archivo.replace(/^webs\//, "").replace(/\//g, "-");
  copyFileSync(path.join(WEB, archivo), path.join(DESTINO, nombre));
}

// Forja: del segundo 13,4 al 15,6, a 30 fps.
const forja = path.join(DESTINO, "forja");
if (existsSync(forja)) rmSync(forja, { recursive: true });
mkdirSync(forja);
execFileSync(ffmpeg, [
  "-hide_banner",
  "-loglevel",
  "error",
  "-ss",
  "13.4",
  "-t",
  "2.2",
  "-i",
  path.join(WEB, "forja", "forja-recorrido.mp4"),
  "-vf",
  "fps=30,scale=1600:1000",
  "-q:v",
  "2",
  path.join(forja, "%03d.jpg"),
]);

console.log(`Listo: ${ARCHIVOS.length} archivos y ${readdirSync(forja).length} cuadros de Forja en public/spot2026/`);
