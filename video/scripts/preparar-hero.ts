/**
 * npm run preparar-hero
 *
 * Deja en public/hero/ el material del hero-loop (gitignorado, se regenera):
 *  - capturas/: las capturas 4K de Yunque y Forja (assets/products) en WebP
 *    de 1600 px: van detrás de la Q, al 30 % y desenfocadas.
 *  - stock/<clip>/c0001.jpg…: los primeros 7 s de cada clip normalizado
 *    (assets/stock/norm), a 15 cuadros por segundo y 1280 px. Cada tramo del
 *    loop dura 6 s más el salto (~1 s): con 7 s alcanza.
 *
 * Remotion no puede usar OffthreadVideo en esta máquina (remotion.exe está
 * bloqueado), y un <video> no es exacto cuadro a cuadro: las secuencias de
 * imágenes sí.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const RAIZ = process.cwd();
const DESTINO = path.join(RAIZ, "public", "hero");

export const CAPTURAS = [
  "yunque/04-tablero-arriba",
  "yunque/07-inventario",
  "yunque/10-mostrador",
  "yunque/13-servicio-tecnico",
  "forja/05-mapa-1200x",
  "forja/06-constelacion",
  "forja/08-sucursal-estanterias",
  "forja/10-sala-de-control",
];

export const CLIPS = ["codigo-178565", "diseno-52922", "teclado-44423", "geometria-25380"];

async function main() {
  if (!ffmpeg) throw new Error("ffmpeg-static no encontró el binario");
  mkdirSync(path.join(DESTINO, "capturas"), { recursive: true });

  for (const captura of CAPTURAS) {
    const origen = path.join(RAIZ, "assets", "products", `${captura}.png`);
    if (!existsSync(origen)) throw new Error(`Falta ${origen}: corré npm run grabar`);
    const nombre = captura.replace("/", "-");
    // 1600 px alcanza: van al 30 % y desenfocadas, y a 4K cada pestaña del render
    // carga ocho; más grandes agotan la memoria de la GPU.
    await sharp(origen).resize({ width: 1600 }).webp({ quality: 88 }).toFile(path.join(DESTINO, "capturas", `${nombre}.webp`));
    console.log("captura", nombre);
  }

  for (const clip of CLIPS) {
    const origen = path.join(RAIZ, "assets", "stock", "norm", `${clip}.mp4`);
    if (!existsSync(origen)) throw new Error(`Falta ${origen}: corré npm run stock y npm run normalizar`);
    const carpeta = path.join(DESTINO, "stock", clip);
    rmSync(carpeta, { recursive: true, force: true });
    mkdirSync(carpeta, { recursive: true });
    execFileSync(
      ffmpeg,
      [
        "-hide_banner", "-loglevel", "error", "-y",
        "-i", origen, "-t", "7",
        "-vf", "fps=15,scale=1280:-2",
        "-q:v", "3",
        path.join(carpeta, "c%04d.jpg"),
      ],
      { stdio: "inherit" },
    );
    console.log("stock", clip, readdirSync(carpeta).length, "cuadros");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
