/**
 * npm run verificar-entregas
 *
 * El checklist técnico del brief sobre los archivos de out/:
 *  - resolución, fps y duración;
 *  - cuántos cuadros hay y si alguno está repetido con el anterior
 *    (framemd5 de los cuadros decodificados): sin duplicados ni saltos.
 *    La única excepción es el arranque del spot: negro puro y la grilla
 *    que aparece tan tenue que varios cuadros seguidos dan idénticos;
 *  - el negro: el valor más frecuente de una zona vacía (el tercio
 *    izquierdo del hero, el cierre del spot), leído del YUV del archivo y
 *    pasado a RGB con su rango y su matriz, tiene que dar #0D0D0F (±1 por
 *    redondeo). El píxel más oscuro de una zona no sirve: el ruido de la
 *    compresión siempre deja alguno por debajo.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const OUT = path.join(process.cwd(), "out");
const NEGRO = [0x0d, 0x0d, 0x0f];

function correr(argumentos: string[]) {
  try {
    return execFileSync(ffmpeg!, ["-hide_banner", ...argumentos], { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28 });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return `${err.stdout ?? ""}${err.stderr ?? ""}`;
  }
}

function info(archivo: string) {
  const texto = correr(["-i", archivo]);
  const video = /Stream.*Video: (\w+).*?, (\d+)x(\d+).*?, ([\d.]+) fps/.exec(texto);
  const duracion = /Duration: (\d+):(\d+):([\d.]+)/.exec(texto);
  const audio = /Stream.*Audio: (\w+)/.exec(texto);
  const color = /Video: \w+.*?, (yuvj?420p)\((tv|pc)(?:, (\w+))?/.exec(texto);
  return {
    completo: color?.[1] === "yuvj420p" || color?.[2] === "pc",
    bt601: color?.[3] === "bt470bg" || color?.[3] === "smpte170m",
    codec: video?.[1],
    ancho: Number(video?.[2]),
    alto: Number(video?.[3]),
    fps: Number(video?.[4]),
    segundos: duracion ? Number(duracion[1]) * 3600 + Number(duracion[2]) * 60 + Number(duracion[3]) : NaN,
    audio: audio?.[1] ?? "sin audio",
  };
}

function cuadros(archivo: string) {
  const texto = execFileSync(ffmpeg!, ["-hide_banner", "-loglevel", "error", "-i", archivo, "-map", "0:v", "-f", "framemd5", "-"], {
    encoding: "utf-8",
    maxBuffer: 1 << 28,
  });
  const lineas = texto.split("\n").filter((l) => l && !l.startsWith("#"));
  const hashes = lineas.map((l) => {
    const campos = l.split(",");
    return campos[campos.length - 1].trim();
  });
  const pts = lineas.map((l) => Number(l.split(",")[2]));
  const repetidos: number[] = [];
  for (let i = 1; i < hashes.length; i++) if (hashes[i] === hashes[i - 1]) repetidos.push(i);
  const pasos = new Set(pts.slice(1).map((p, i) => p - pts[i]));
  return { total: hashes.length, repetidos, pasosDistintos: pasos.size };
}

const hex = (c: number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
const esNegro = (c: number[]) => c.every((v, i) => Math.abs(v - NEGRO[i]) <= 1);

function moda(valores: number[]) {
  const cuenta = new Map<number, number>();
  for (const v of valores) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** El color más frecuente de la zona [x0, y0, x1, y1] (fracciones) del cuadro del segundo dado. */
function negroDeZona(archivo: string, i: ReturnType<typeof info>, segundo: number, [x0, y0, x1, y1]: number[]) {
  const crudo = execFileSync(ffmpeg!, ["-hide_banner", "-loglevel", "error", "-ss", String(segundo), "-i", archivo, "-frames:v", "1", "-f", "rawvideo", "-"], {
    maxBuffer: 1 << 28,
  });
  const { ancho: W, alto: H } = i;
  const ys: number[] = [];
  const us: number[] = [];
  const vs: number[] = [];
  for (let y = Math.round(H * y0); y < Math.round(H * y1); y++) {
    for (let x = Math.round(W * x0); x < Math.round(W * x1); x++) {
      ys.push(crudo[y * W + x]);
      if (x % 2 === 0 && y % 2 === 0) {
        us.push(crudo[W * H + (y >> 1) * (W >> 1) + (x >> 1)]);
        vs.push(crudo[W * H + (W >> 1) * (H >> 1) + (y >> 1) * (W >> 1) + (x >> 1)]);
      }
    }
  }
  const [Y, U, V] = [moda(ys), moda(us), moda(vs)];
  const [kr, kb] = i.bt601 ? [0.299, 0.114] : [0.2126, 0.0722];
  const luma = i.completo ? Y : ((Y - 16) * 255) / 219;
  const cb = i.completo ? U - 128 : ((U - 128) * 255) / 224;
  const cr = i.completo ? V - 128 : ((V - 128) * 255) / 224;
  const r = luma + 2 * (1 - kr) * cr;
  const b = luma + 2 * (1 - kb) * cb;
  const g = (luma - kr * r - kb * b) / (1 - kr - kb);
  return [r, g, b].map((v) => Math.min(255, Math.max(0, Math.round(v))));
}

/** Las zonas donde no hay nada más que fondo y grilla: [segundo, x0, y0, x1, y1]. */
const ZONA_HERO: [number, number, number, number, number][] = [
  [3, 0.03, 0.2, 0.08, 0.3],
  [15, 0.03, 0.6, 0.08, 0.7],
];
const ZONA_SPOT: [number, number, number, number, number][] = [
  [0.1, 0.3, 0.3, 0.7, 0.7],
  [44.5, 0.03, 0.2, 0.08, 0.3],
];

/** negroInicial: hasta qué cuadro pueden repetirse (el arranque del spot, mientras aparece la grilla). */
const ENTREGAS: { archivo: string; negro: [number, number, number, number, number][]; negroInicial?: number }[] = [
  { archivo: "hero-loop-4k.mp4", negro: ZONA_HERO },
  { archivo: "hero-loop-4k.webm", negro: ZONA_HERO },
  { archivo: "hero-loop-1080.mp4", negro: ZONA_HERO },
  { archivo: "hero-loop-1080.webm", negro: ZONA_HERO },
  { archivo: "spot-completo-4k.mp4", negro: ZONA_SPOT, negroInicial: 60 },
  { archivo: "spot-completo-4k.webm", negro: ZONA_SPOT, negroInicial: 60 },
  { archivo: "spot-prueba-1080.mp4", negro: ZONA_SPOT, negroInicial: 60 },
];

async function main() {
  let fallas = 0;
  for (const { archivo, negro, negroInicial = 0 } of ENTREGAS) {
    const ruta = path.join(OUT, archivo);
    if (!existsSync(ruta)) {
      console.log(`– ${archivo}: no está`);
      continue;
    }
    const i = info(ruta);
    const c = cuadros(ruta);
    const esperados = Math.round(i.segundos * i.fps);
    const muestras = negro.map(([s, ...zona]) => negroDeZona(ruta, i, s, zona));
    const repetidos = c.repetidos.filter((i) => i > negroInicial);
    const ok = repetidos.length === 0 && c.pasosDistintos <= 1 && Math.abs(c.total - esperados) <= 1 && muestras.every(esNegro);
    if (!ok) fallas++;
    console.log(
      `${ok ? "✔" : "✘"} ${archivo}: ${i.codec} ${i.ancho}×${i.alto} ${i.fps} fps, ${i.segundos.toFixed(2)} s, ${i.audio} · ` +
        `${c.total} cuadros (esperados ${esperados}), ${repetidos.length} repetidos${repetidos.length ? ` (${repetidos.slice(0, 8).join(", ")}…)` : ""}${c.repetidos.length > repetidos.length ? ` + ${c.repetidos.length - repetidos.length} del arranque (hasta el ${Math.max(...c.repetidos.filter((i) => i <= negroInicial))})` : ""}, ${c.pasosDistintos === 1 ? "paso de tiempo parejo" : `${c.pasosDistintos} pasos distintos`} · ` +
        `negro ${muestras.map(hex).join(" ")}`,
    );
  }
  process.exit(fallas ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
