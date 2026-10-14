/**
 * Baja el stock de video desde la API de Pixabay (licencia de uso comercial
 * gratis, sin atribución obligatoria; igual queda registrado en CREDITS.md).
 *
 * Por cada búsqueda trae varios candidatos, prioriza los que vienen en 4K
 * (ancho >= 3840) y baja los mejores. Al final arma una hoja de contactos
 * con un cuadro de cada clip para elegir.
 *
 * Uso: npm run stock          (necesita PIXABAY_API_KEY en video/.env)
 * Salida: assets/stock/raw/*.mp4, assets/stock/CREDITS.md,
 *         out/revision/stock-hoja.jpg
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp, { type OverlayOptions } from "sharp";

const CLAVE = process.env.PIXABAY_API_KEY;
const RAIZ = process.cwd();
const CRUDO = path.join(RAIZ, "assets", "stock", "raw");
const REVISION = path.join(RAIZ, "out", "revision");
const POR_BUSQUEDA = 3;
/** El ffmpeg que trae Remotion: se llama directo, sin shell (la ruta tiene espacios). */
export const FFMPEG = path.join(RAIZ, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");

/** Las búsquedas del brief, en los términos que mejor responde Pixabay. */
const BUSQUEDAS = [
  { id: "codigo", q: "programming code screen" },
  { id: "teclado", q: "typing keyboard" },
  { id: "diseno", q: "user interface design" },
  { id: "servidores", q: "server room" },
  { id: "geometria", q: "abstract technology lines" },
  { id: "deposito", q: "warehouse shelves" },
  { id: "herramientas", q: "factory industrial" },
  { id: "ciudad", q: "city night timelapse" },
];

/** Segunda ronda (npm run stock -- extra): los huecos que dejó la primera. */
const BUSQUEDAS_EXTRA = [
  { id: "datacenter", q: "data center" },
  { id: "rack", q: "server rack" },
  { id: "webdesign", q: "web design computer" },
  { id: "programador", q: "programmer dark" },
  { id: "taladro", q: "drill workshop" },
  { id: "taller", q: "metal workshop" },
  { id: "estanterias", q: "warehouse logistics" },
];

type Variante = { url: string; width: number; height: number; size: number };
type Hit = {
  id: number;
  pageURL: string;
  tags: string;
  duration: number;
  user: string;
  videos: { large: Variante; medium: Variante };
};

async function buscar(q: string): Promise<Hit[]> {
  const url = new URL("https://pixabay.com/api/videos/");
  url.searchParams.set("key", CLAVE!);
  url.searchParams.set("q", q);
  url.searchParams.set("per_page", "40");
  url.searchParams.set("safesearch", "true");
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`Pixabay respondió ${respuesta.status} para "${q}"`);
  const datos = (await respuesta.json()) as { hits: Hit[] };
  return datos.hits;
}

/** 4K primero; después, los más largos. Solo horizontales y sin repetir clips. */
const yaElegidos = new Set<number>();
function elegir(hits: Hit[]) {
  const lista = hits
    .filter(
      (h) =>
        h.videos.large?.url &&
        h.duration >= 6 &&
        h.videos.large.width > h.videos.large.height &&
        !yaElegidos.has(h.id),
    )
    .sort((a, b) => {
      const a4k = a.videos.large.width >= 3840 ? 1 : 0;
      const b4k = b.videos.large.width >= 3840 ? 1 : 0;
      return b4k - a4k || b.videos.large.width - a.videos.large.width || b.duration - a.duration;
    })
    .slice(0, POR_BUSQUEDA);
  for (const h of lista) yaElegidos.add(h.id);
  return lista;
}

async function bajar(url: string, destino: string) {
  if (existsSync(destino)) return;
  const respuesta = await fetch(url);
  if (!respuesta.ok || !respuesta.body) throw new Error(`no pude bajar ${url}`);
  await pipeline(Readable.fromWeb(respuesta.body as never), createWriteStream(destino));
}

/** Un cuadro del clip (al 40 % de su duración) con el ffmpeg de Remotion. */
function cuadro(clip: string, segundos: number, salida: string) {
  execFileSync(
    FFMPEG,
    ["-y", "-loglevel", "error", "-ss", String(segundos), "-i", clip, "-frames:v", "1", "-vf", "scale=480:-2", salida],
    { stdio: "ignore" },
  );
}

async function main() {
  if (!CLAVE) throw new Error("Falta PIXABAY_API_KEY en video/.env");
  mkdirSync(CRUDO, { recursive: true });
  mkdirSync(REVISION, { recursive: true });

  const extra = process.argv[2] === "extra";
  const elegidos: Array<Hit & { busqueda: string; archivo: string }> = [];
  for (const { id, q } of extra ? BUSQUEDAS_EXTRA : BUSQUEDAS) {
    const hits = elegir(await buscar(q));
    for (const hit of hits) {
      const archivo = `${id}-${hit.id}.mp4`;
      const v = hit.videos.large;
      process.stdout.write(`  ${archivo.padEnd(26)} ${v.width}x${v.height}  ${hit.duration}s  `);
      await bajar(v.url, path.join(CRUDO, archivo));
      console.log(`${Math.round(v.size / 1024 / 1024)} MB`);
      elegidos.push({ ...hit, busqueda: q, archivo });
    }
  }

  // Créditos: autor y link de cada clip.
  const creditos = [
    "# Créditos del stock",
    "",
    "Videos de [Pixabay](https://pixabay.com), bajo la [Licencia de contenido de Pixabay](https://pixabay.com/service/license-summary/): uso comercial gratis, sin atribución obligatoria.",
    "",
    "| Archivo | Autor | Fuente | Resolución | Búsqueda |",
    "| --- | --- | --- | --- | --- |",
    ...elegidos.map(
      (h) =>
        `| ${h.archivo} | ${h.user} | [pixabay.com/videos/${h.id}](${h.pageURL}) | ${h.videos.large.width}×${h.videos.large.height} | ${h.busqueda} |`,
    ),
    "",
  ].join("\n");
  writeFileSync(path.join(RAIZ, "assets", "stock", extra ? "CREDITS-extra.md" : "CREDITS.md"), creditos);

  // Hoja de contactos.
  const ANCHO = 480;
  const ALTO = 270;
  const COLUMNAS = POR_BUSQUEDA;
  const capas: OverlayOptions[] = [];
  for (const [i, h] of elegidos.entries()) {
    const temporal = path.join(REVISION, `_cuadro-${i}.jpg`);
    cuadro(path.join(CRUDO, h.archivo), Math.max(1, h.duration * 0.4), temporal);
    const imagen = await sharp(temporal).resize(ANCHO, ALTO, { fit: "cover" }).toBuffer();
    const x = (i % COLUMNAS) * ANCHO;
    const y = Math.floor(i / COLUMNAS) * ALTO;
    const etiqueta = `${h.archivo} · ${h.videos.large.width}px`;
    capas.push({ input: imagen, left: x, top: y });
    capas.push({
      input: Buffer.from(
        `<svg width="${ANCHO}" height="24"><rect width="${ANCHO}" height="24" fill="black" opacity="0.75"/><text x="8" y="17" font-family="Arial" font-size="14" fill="white">${etiqueta}</text></svg>`,
      ),
      left: x,
      top: y,
    });
  }
  await sharp({
    create: {
      width: ANCHO * COLUMNAS,
      height: ALTO * Math.ceil(elegidos.length / COLUMNAS),
      channels: 3,
      background: "#111",
    },
  })
    .composite(capas)
    .jpeg({ quality: 78 })
    .toFile(path.join(REVISION, extra ? "stock-hoja-extra.jpg" : "stock-hoja.jpg"));
  for (let i = 0; i < elegidos.length; i++) rmSync(path.join(REVISION, `_cuadro-${i}.jpg`), { force: true });
  console.log(`\n${elegidos.length} clips · CREDITS.md · out/revision/stock-hoja.jpg`);
}

void main();
