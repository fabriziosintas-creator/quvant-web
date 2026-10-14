/**
 * Lleva el stock elegido a la paleta Quvant y a 4K exacto.
 *
 * 1. Genera la LUT assets/luts/quvant.cube (33³): desatura, apoya los
 *    negros en #0D0D0F, termina las altas luces en #ECECEE con un leve frío
 *    neutro, y suaviza el contraste con una curva en S.
 * 2. Recorta 10 s de cada clip elegido y lo normaliza con ffmpeg:
 *    scale + crop a 3840×2160, eq (saturación 0.35, contraste 1.08,
 *    brillo −0.04) y la LUT. Salida en H.264 CRF 16 (intermedio liviano en
 *    lugar de ProRes: 10 s de ProRes 4K pesan más de 1 GB por clip).
 * 3. Escribe los créditos finales (solo los elegidos) y una hoja de
 *    contactos antes/después.
 *
 * El brief lo pide como normalize-stock.sh; en Windows va en TypeScript
 * con el ffmpeg que trae Remotion.
 *
 * Uso: npm run normalizar
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";
import { COLOR } from "../src/brand/tokens";

const RAIZ = process.cwd();
// La ffmpeg de Remotion viene recortada (sin lut3d ni eq): para el color se usa ffmpeg-static.
const FFMPEG = path.join(RAIZ, "node_modules", "ffmpeg-static", "ffmpeg.exe");
const FFPROBE = path.join(RAIZ, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe");
const CRUDO = path.join(RAIZ, "assets", "stock", "raw");
const NORMAL = path.join(RAIZ, "assets", "stock", "norm");
const REVISION = path.join(RAIZ, "out", "revision");
const LUT = "assets/luts/quvant.cube"; // relativa: el filtro de ffmpeg no se lleva bien con espacios
const SEGUNDOS = 10;

/** Los clips elegidos y para qué escena del spot sirve cada uno. */
const SELECCION = [
  { archivo: "codigo-178565.mp4", escena: "01 · Programación — código en pantalla" },
  { archivo: "teclado-44423.mp4", escena: "01 · Programación — manos en el teclado" },
  { archivo: "diseno-52922.mp4", escena: "02 · Diseño — interfaz técnica oscura" },
  { archivo: "geometria-25380.mp4", escena: "02 · Diseño — geometría de líneas" },
  { archivo: "datacenter-14900.mp4", escena: "Fondo — rack de servidores" },
  { archivo: "deposito-197209.mp4", escena: "Industria — depósito con estanterías" },
  { archivo: "taladro-141581.mp4", escena: "Industria — piso de fábrica" },
  { archivo: "taller-86262.mp4", escena: "Industria — torno, primer plano" },
  { archivo: "ciudad-344181.mp4", escena: "Contexto (opcional) — ciudad de noche" },
];

const hexA01 = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

function generarLut() {
  const N = 33;
  const negro = hexA01(COLOR.negro);
  const blanco = hexA01(COLOR.blanco);
  const lineas = ['TITLE "Quvant"', `LUT_3D_SIZE ${N}`, ""];
  // En .cube el rojo varía más rápido, después el verde, después el azul.
  for (let b = 0; b < N; b++) {
    for (let g = 0; g < N; g++) {
      for (let r = 0; r < N; r++) {
        const c = [r / (N - 1), g / (N - 1), b / (N - 1)];
        const luz = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
        const salida = c.map((canal, i) => {
          // Desaturar a la mitad de lo que ya dejó el eq.
          let t = luz + (canal - luz) * 0.5;
          // Curva en S suave.
          t = t * t * (3 - 2 * t) * 0.35 + t * 0.65;
          // Entre el negro y el blanco de la marca.
          let v = negro[i] + t * (blanco[i] - negro[i]);
          // Altas luces apenas frías.
          if (i === 2) v += 0.012 * t * t;
          if (i === 0) v -= 0.006 * t * t;
          return Math.min(1, Math.max(0, v));
        });
        lineas.push(salida.map((v) => v.toFixed(6)).join(" "));
      }
    }
  }
  mkdirSync(path.join(RAIZ, "assets", "luts"), { recursive: true });
  writeFileSync(path.join(RAIZ, LUT), lineas.join("\n") + "\n");
  console.log(`LUT: ${LUT} (${N}³)`);
}

function duracion(clip: string) {
  const salida = execFileSync(FFPROBE, [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", clip,
  ]).toString();
  return parseFloat(salida);
}

function normalizar(archivo: string) {
  const entrada = path.join(CRUDO, archivo);
  const salida = path.join(NORMAL, archivo);
  const total = duracion(entrada);
  // Arranca al 20 %: los primeros segundos de stock suelen ser entrada o fundido.
  const inicio = Math.max(0, Math.min(total * 0.2, total - SEGUNDOS));
  const largo = Math.min(SEGUNDOS, total - inicio);
  const filtro = [
    "scale=3840:2160:force_original_aspect_ratio=increase",
    "crop=3840:2160",
    "eq=saturation=0.35:contrast=1.08:brightness=-0.04",
    `lut3d=file=${LUT}`,
  ].join(",");
  execFileSync(
    FFMPEG,
    [
      "-y", "-loglevel", "error", "-ss", inicio.toFixed(2), "-t", largo.toFixed(2), "-i", entrada,
      "-vf", filtro, "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", salida,
    ],
    { cwd: RAIZ, stdio: "inherit" },
  );
  return { inicio, largo };
}

function cuadro(clip: string, segundos: number, destino: string) {
  execFileSync(FFMPEG, [
    "-y", "-loglevel", "error", "-ss", String(segundos), "-i", clip, "-frames:v", "1",
    "-vf", "scale=480:270:force_original_aspect_ratio=increase,crop=480:270", destino,
  ]);
}

/** Créditos finales: solo los elegidos, tomados de las listas de candidatos. */
function creditos() {
  const filas = new Map<string, string>();
  for (const lista of ["CREDITS.md", "CREDITS-extra.md"]) {
    const ruta = path.join(RAIZ, "assets", "stock", lista);
    if (!existsSync(ruta)) continue;
    for (const fila of readFileSync(ruta, "utf8").split("\n")) {
      const archivo = fila.split("|")[1]?.trim();
      if (archivo?.endsWith(".mp4")) filas.set(archivo, fila);
    }
  }
  const texto = [
    "# Créditos del stock",
    "",
    "Videos de [Pixabay](https://pixabay.com), bajo la [Licencia de contenido de Pixabay](https://pixabay.com/service/license-summary/): uso comercial gratis, sin atribución obligatoria.",
    "",
    "| Archivo | Autor | Fuente | Resolución | Búsqueda |",
    "| --- | --- | --- | --- | --- |",
    ...SELECCION.map((s) => filas.get(s.archivo) ?? `| ${s.archivo} | ? | ? | ? | ? |`),
    "",
  ].join("\n");
  writeFileSync(path.join(RAIZ, "assets", "stock", "CREDITS.md"), texto);
}

async function main() {
  generarLut();
  mkdirSync(NORMAL, { recursive: true });
  mkdirSync(REVISION, { recursive: true });

  const ANCHO = 480;
  const ALTO = 270;
  const capas: OverlayOptions[] = [];
  for (const [i, { archivo, escena }] of SELECCION.entries()) {
    process.stdout.write(`  ${archivo.padEnd(24)} `);
    const { inicio } = normalizar(archivo);
    console.log("listo");
    const antes = path.join(REVISION, `_antes-${i}.jpg`);
    const despues = path.join(REVISION, `_despues-${i}.jpg`);
    cuadro(path.join(CRUDO, archivo), inicio + 3, antes);
    cuadro(path.join(NORMAL, archivo), 3, despues);
    const y = i * ALTO;
    capas.push({ input: await sharp(antes).toBuffer(), left: 0, top: y });
    capas.push({ input: await sharp(despues).toBuffer(), left: ANCHO, top: y });
    capas.push({
      input: Buffer.from(
        `<svg width="${ANCHO * 2}" height="24"><rect width="${ANCHO * 2}" height="24" fill="black" opacity="0.75"/><text x="8" y="17" font-family="Arial" font-size="14" fill="white">${escena}  ·  antes | después</text></svg>`,
      ),
      left: 0,
      top: y,
    });
    rmSync(antes, { force: true });
    rmSync(despues, { force: true });
  }
  await sharp({ create: { width: ANCHO * 2, height: ALTO * SELECCION.length, channels: 3, background: "#111" } })
    .composite(capas)
    .jpeg({ quality: 80 })
    .toFile(path.join(REVISION, "contact-sheet.jpg"));
  creditos();
  console.log(`\n${SELECCION.length} clips en assets/stock/norm · out/revision/contact-sheet.jpg`);
}

void main();
