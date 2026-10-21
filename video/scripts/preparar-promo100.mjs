/**
 * npm run preparar-promo100
 *
 * Deja en public/promo100/ las capturas de la demo del sistema para el
 * video de "Primeros 100" (las sacó la verificación del paso 1 y viven en
 * marca/promo/capturas-demo/, fuera del repo). Cada una se recorta sin la
 * barra lateral (ahí están el logo de la demo y "con yunque": regla de no
 * mostrar ese nombre) y se pasa a WebP.
 */
import { mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ORIGEN = path.resolve("..", "..", "marca", "promo", "capturas-demo");
const DESTINO = path.resolve("public", "promo100");
mkdirSync(DESTINO, { recursive: true });

// La barra lateral de la demo ocupa los primeros 240 px de una captura de 1600 × 1000.
const BARRA = 240;

const archivos = readdirSync(ORIGEN).filter((f) => f.endsWith(".png"));
for (const archivo of archivos) {
  const entrada = path.join(ORIGEN, archivo);
  const { width = 0, height = 0 } = await sharp(entrada).metadata();
  const salida = path.join(DESTINO, archivo.replace(/\.png$/, ".webp"));
  await sharp(entrada)
    .extract({ left: BARRA, top: 0, width: width - BARRA, height })
    .webp({ quality: 92 })
    .toFile(salida);
  console.log("listo", path.basename(salida), `${width - BARRA}×${height}`);
}
console.log(`${archivos.length} capturas en public/promo100/`);
