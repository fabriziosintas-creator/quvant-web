/**
 * Prepara las capturas que se ven en las pantallas del video.
 *
 * De cada imagen de origen deja dos versiones en public/pantallas/:
 *   <nombre>-mono.webp      escala de grises, +10 % de contraste
 *   <nombre>-color35.webp   colores reales al 35 % de saturación
 *
 * Las dos llevan el piso de negro de la marca (#0D0D0F): ningún píxel
 * baja de ahí, así la pantalla funde con el fondo del video.
 *
 * Uso:  npm run pantallas
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const AQUI = import.meta.dirname;
const VIDEO = path.resolve(AQUI, "..");
const RAIZ = path.resolve(VIDEO, "..", ".."); // la carpeta "Quvant WEB"
const DESTINO = path.join(VIDEO, "public", "pantallas");

const ANCHO_MAXIMO = 2048;
const CALIDAD = 90;

/**
 * Un solo paso lineal que hace las dos cosas: +10 % de contraste alrededor
 * del medio y piso de negro en #0D0D0F (13, 13, 15). El azul va un punto
 * más arriba porque el negro de la marca es apenas frío.
 */
const CONTRASTE = 1.1;
const CENTRO = 128;
const PISO = [13, 13, 15];
const ESCALA = PISO.map((piso) => ((255 - piso) / 255) * CONTRASTE);
const DESPLAZAMIENTO = PISO.map(
  (piso, i) => ((255 - piso) / 255) * (-CENTRO * (CONTRASTE - 1)) + piso,
);

const ORIGENES = [
  {
    carpeta: path.join(RAIZ, "marca", "video", "capturas-sistema"),
    etiqueta: "capturas del sistema",
    obligatoria: true,
  },
  {
    carpeta: path.join(RAIZ, "marca", "ferremix"),
    etiqueta: "Ferremix",
    obligatoria: false,
    // Del caso Ferremix solo entran al video las dos de la propuesta nueva.
    soloEstas: ["ferremix-nueva-escritorio.jpg", "ferremix-nueva-celular-pantalla.jpg"],
  },
];

const esImagen = (nombre) => /\.(png|jpe?g|webp)$/i.test(nombre);

async function tratar(origen, destino, modo) {
  const base = sharp(origen).resize({
    width: ANCHO_MAXIMO,
    withoutEnlargement: true,
    fit: "inside",
  });
  // Saturación 0 en vez de grayscale(): desatura igual pero deja los tres
  // canales, que es lo que necesita el ajuste de abajo (grayscale deja uno).
  const coloreada = base.modulate({ saturation: modo === "mono" ? 0 : 0.35 });
  const info = await coloreada
    .linear(ESCALA, DESPLAZAMIENTO)
    .webp({ quality: CALIDAD })
    .toFile(destino);
  return info;
}

async function main() {
  await mkdir(DESTINO, { recursive: true });
  const hechas = [];
  const faltantes = [];

  for (const origen of ORIGENES) {
    if (!existsSync(origen.carpeta)) {
      faltantes.push(origen);
      continue;
    }
    const archivos = (await readdir(origen.carpeta))
      .filter(esImagen)
      .filter((n) => !origen.soloEstas || origen.soloEstas.includes(n));

    for (const archivo of archivos) {
      const nombre = path.parse(archivo).name;
      const entrada = path.join(origen.carpeta, archivo);
      for (const modo of ["mono", "color35"]) {
        const salida = path.join(DESTINO, `${nombre}-${modo}.webp`);
        const info = await tratar(entrada, salida, modo);
        hechas.push({
          archivo: path.basename(salida),
          medidas: `${info.width}x${info.height}`,
          kb: Math.round(info.size / 1024),
        });
      }
    }
  }

  console.log(`\nListas ${hechas.length} imágenes en video/public/pantallas/\n`);
  for (const h of hechas) {
    console.log(`  ${h.archivo.padEnd(46)} ${h.medidas.padStart(11)}  ${String(h.kb).padStart(5)} KB`);
  }

  for (const falta of faltantes) {
    console.log(
      `\n  FALTA: no encontré "${falta.etiqueta}" en ${path.relative(RAIZ, falta.carpeta)}`,
    );
    if (falta.obligatoria) {
      console.log("  Sin esas capturas, las escenas 1 y 2 del video no se pueden armar.");
    }
  }

  // Un índice para que las escenas sepan qué hay sin adivinar nombres.
  await writeFile(
    path.join(DESTINO, "indice.json"),
    JSON.stringify(
      hechas.map((h) => h.archivo),
      null,
      2,
    ),
  );
  console.log("");
}

await main();
