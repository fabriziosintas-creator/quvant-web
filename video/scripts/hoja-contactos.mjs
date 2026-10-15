/**
 * node scripts/hoja-contactos.mjs <salida.jpg> <ancho de cada cuadro> <columnas> <imagen>...
 * Arma una hoja de contactos con el nombre de cada archivo encima (para revisar renders).
 */
import path from "node:path";
import sharp from "sharp";

const [salida, anchoTxt, columnasTxt, ...archivos] = process.argv.slice(2);
const ancho = Number(anchoTxt);
const columnas = Number(columnasTxt);
const alto = Math.round((ancho * 9) / 16);
const filas = Math.ceil(archivos.length / columnas);
const piezas = await Promise.all(
  archivos.map(async (archivo, i) => {
    const rotulo = Buffer.from(
      `<svg width="${ancho}" height="28"><rect width="100%" height="100%" fill="#000" opacity="0.7"/><text x="8" y="20" font-family="monospace" font-size="18" fill="#fff">${path.basename(archivo)}</text></svg>`,
    );
    const imagen = await sharp(archivo).resize(ancho, alto, { fit: "cover" }).composite([{ input: rotulo, top: 0, left: 0 }]).toBuffer();
    return { input: imagen, left: (i % columnas) * ancho, top: Math.floor(i / columnas) * alto };
  }),
);
await sharp({ create: { width: ancho * columnas, height: alto * filas, channels: 3, background: "#000" } })
  .composite(piezas)
  .jpeg({ quality: 85 })
  .toFile(salida);
