/**
 * npm run preparar-spot
 *
 * Deja en public/spot/ el material del spot-completo (gitignorado, se
 * regenera):
 *  - capturas/: las capturas 4K de Yunque y Forja (assets/products) en
 *    WebP. El tablero va entero (la cámara se acerca a la cifra y a
 *    "Sincronizado"); el resto, a 2560 px, que alcanza para el plano más
 *    grande y no agota la memoria de la GPU (2 GB compartidos entre las
 *    pestañas del render).
 *  - stock/<clip>/c0001.jpg…: tramos de los clips normalizados
 *    (assets/stock/norm), a su velocidad original, en secuencias de
 *    imágenes: exactas cuadro a cuadro (OffthreadVideo no anda en esta
 *    máquina y un <video> no es exacto).
 *  - stock/forja-3d/: la vista 3D de la sucursal por dentro, de la toma en
 *    vivo de Forja (npm run grabar-forja), con la cámara moviéndose sola.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const RAIZ = process.cwd();
const DESTINO = path.join(RAIZ, "public", "spot");

const CAPTURAS: { archivo: string; ancho: number }[] = [
  { archivo: "yunque/01-ingresar-quieto", ancho: 2560 },
  { archivo: "yunque/02-ingresar-autocompletado", ancho: 2560 },
  { archivo: "yunque/03-ingresar-boton", ancho: 2560 },
  { archivo: "yunque/04-tablero-arriba", ancho: 3840 },
  { archivo: "yunque/07-inventario", ancho: 2560 },
  { archivo: "yunque/08-inventario-bajo-minimo", ancho: 2560 },
  { archivo: "yunque/10-mostrador", ancho: 2560 },
  { archivo: "yunque/11-mostrador-busqueda", ancho: 2560 },
  { archivo: "yunque/12-mostrador-carrito", ancho: 2560 },
  { archivo: "forja/05-mapa-1200x", ancho: 2560 },
  { archivo: "forja/06-constelacion", ancho: 2560 },
  { archivo: "forja/10-sala-de-control", ancho: 2560 },
];

/** Los tramos de stock que usa el spot: desde qué segundo, cuántos y a qué ancho. */
export const TRAMOS_STOCK: { clip: string; desde: number; segundos: number; ancho: number }[] = [
  { clip: "codigo-178565", desde: 0, segundos: 10, ancho: 2880 },
  { clip: "teclado-44423", desde: 0, segundos: 10, ancho: 2560 },
  { clip: "diseno-52922", desde: 0, segundos: 8, ancho: 1920 },
  { clip: "geometria-25380", desde: 0, segundos: 8, ancho: 2560 },
  { clip: "deposito-197209", desde: 0, segundos: 5, ancho: 2880 },
];

/** La sucursal en 3D dentro de la toma de Forja (marcas.json: "3d" en 38,17 s). */
const FORJA_3D = { desde: 38.4, segundos: 5 };

function secuencia(origen: string, carpeta: string, argumentos: string[]) {
  rmSync(carpeta, { recursive: true, force: true });
  mkdirSync(carpeta, { recursive: true });
  execFileSync(
    ffmpeg!,
    ["-hide_banner", "-loglevel", "error", "-y", ...argumentos.slice(0, 2), "-i", origen, ...argumentos.slice(2), "-q:v", "2", path.join(carpeta, "c%04d.jpg")],
    { stdio: "inherit" },
  );
  return readdirSync(carpeta).length;
}

async function main() {
  if (!ffmpeg) throw new Error("ffmpeg-static no encontró el binario");
  mkdirSync(path.join(DESTINO, "capturas"), { recursive: true });

  for (const { archivo, ancho } of CAPTURAS) {
    const origen = path.join(RAIZ, "assets", "products", `${archivo}.png`);
    if (!existsSync(origen)) throw new Error(`Falta ${origen}: corré npm run grabar`);
    const nombre = archivo.replace("/", "-");
    await sharp(origen).resize({ width: ancho }).webp({ quality: 92 }).toFile(path.join(DESTINO, "capturas", `${nombre}.webp`));
    console.log("captura", nombre);
  }

  for (const { clip, desde, segundos, ancho } of TRAMOS_STOCK) {
    const origen = path.join(RAIZ, "assets", "stock", "norm", `${clip}.mp4`);
    if (!existsSync(origen)) throw new Error(`Falta ${origen}: corré npm run stock y npm run normalizar`);
    const n = secuencia(origen, path.join(DESTINO, "stock", clip), ["-ss", String(desde), "-t", String(segundos), "-vf", `scale=${ancho}:-2`]);
    console.log("stock", clip, n, "cuadros");
  }

  const toma = path.join(RAIZ, "assets", "products", "forja-video", "forja-recorrido.mp4");
  if (!existsSync(toma)) throw new Error(`Falta ${toma}: corré npm run grabar-forja`);
  const n = secuencia(toma, path.join(DESTINO, "stock", "forja-3d"), ["-ss", String(FORJA_3D.desde), "-t", String(FORJA_3D.segundos)]);
  console.log("forja-3d", n, "cuadros");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
