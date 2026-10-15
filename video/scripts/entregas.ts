/**
 * npm run entregas -- hero | hero-1080 | hero-4k | unir-spot | spot | prueba-1080 | web | web-hero | web-spot | docs
 *
 * Arma las entregas finales en out/ a partir de los renders de Remotion:
 *
 *  hero (de out/hero-loop-4k.mp4, que renderiza Remotion):
 *   - hero-poster.jpg: el cuadro 0, en 4K. El brief pedía el segundo 3,
 *     pero ahí la Q está girada 45° y un póster es un cuadro quieto (el
 *     manual no deja la Q girada en un cuadro quieto); además el video
 *     arranca en el cuadro 0, así que el paso del póster al video no salta.
 *   - hero-loop-1080.mp4: H.264 1080p para celular (escalado del 4K: el
 *     mismo loop exacto).
 *   - hero-loop-1080.webm: AV1 1080p, la versión liviana para el sitio.
 *   - hero-loop-4k.webm: AV1 4K.
 *
 *  unir-spot: junta los tres tramos del render del spot
 *   (out/revision/spot-parte-*.mp4) en out/spot-completo-4k-imagen.mp4, sin
 *   recodificar.
 *
 *  spot (de out/spot-completo-4k-imagen.mp4, el render mudo):
 *   - spot-completo-4k.mp4: la imagen tal cual + la mezcla (AAC).
 *   - spot-completo-4k.webm: VP9 + la mezcla (Opus).
 *   La mezcla: la música (assets/audio/musica.mp3 o .wav si existe, si no
 *   musica-quvant.wav de npm run musica) más un "tic" en cada aterrizaje
 *   del punto, normalizada a −14 LUFS en dos pasadas.
 *
 *  prueba-1080: spot-prueba-1080.mp4, la copia de revisión: el spot final
 *   bajado a 1080p con el segundo y el cuadro arriba a la derecha.
 *
 *  web: lo que usa el sitio (quvant-web/public/): el hero-loop en AV1
 *   1080p y 4K más el MP4 1080p, el póster en WebP; el spot en 1080p (AV1
 *   con Opus y H.264 con AAC) y su póster (la firma del cierre). web-hero y
 *   web-spot hacen cada mitad.
 *
 *  docs (también al final de hero y spot): CREDITS.md e INTEGRACION.md de
 *  entregas/ a out/, con los pesos reales de los archivos.
 *
 * Los derivados salen en BT.709 y rango de TV (lo estándar para la web);
 * Remotion entrega rango completo BT.601 y acá se convierte bien.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";
import { aterrizajesSpot } from "../src/transitions/tiempos";

const RAIZ = process.cwd();
const OUT = path.join(RAIZ, "out");
const AUDIO = path.join(RAIZ, "assets", "audio");

function ff(argumentos: string[], salida = false) {
  if (!ffmpeg) throw new Error("ffmpeg-static no encontró el binario");
  const r = execFileSync(ffmpeg, ["-hide_banner", "-y", ...argumentos], {
    stdio: salida ? ["ignore", "pipe", "pipe"] : ["ignore", "inherit", "inherit"],
    encoding: "utf-8",
  });
  return r;
}

/**
 * De rango completo BT.601 (Remotion) a rango de TV BT.709, con la escala
 * que haga falta. Sin accurate_rnd y croma completo, swscale redondea el
 * negro a #0C0C0C; así queda en #0D0D0F exacto (Y 27, Cb 129, Cr 128).
 */
const aWeb = (ancho?: number) =>
  `scale=${ancho ? `${ancho}:-2:` : ""}flags=${ancho ? "lanczos+" : ""}accurate_rnd+full_chroma_int+full_chroma_inp:in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p`;
const BANDERAS_709 = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"];

function paso(nombre: string, f: () => void) {
  const inicio = Date.now();
  process.stdout.write(`${nombre}… `);
  f();
  console.log(`${Math.round((Date.now() - inicio) / 1000)} s`);
}

/** hero-1080: póster y las dos versiones 1080p; hero-4k: el AV1 4K (el más lento, más de media hora). */
async function hero(partes: { liviano: boolean; pesado: boolean } = { liviano: true, pesado: true }) {
  const fuente = path.join(OUT, "hero-loop-4k.mp4");
  if (!existsSync(fuente)) throw new Error("Falta out/hero-loop-4k.mp4: npx remotion render src/index.ts HeroLoop out/hero-loop-4k.mp4 --gl=angle");

  if (partes.liviano) await heroLiviano(fuente);
  if (partes.pesado) heroPesado(fuente);
}

async function heroLiviano(fuente: string) {
  const png = path.join(OUT, "revision", "hero-poster.png");
  paso("hero-poster.jpg", () => {
    ff(["-loglevel", "error", "-i", fuente, "-frames:v", "1", "-vf", "scale=in_range=pc:in_color_matrix=bt601,format=rgb24", png]);
  });
  await sharp(png).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(OUT, "hero-poster.jpg"));

  paso("hero-loop-1080.mp4", () =>
    ff([
      "-loglevel", "error", "-i", fuente, "-vf", aWeb(1920),
      "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-profile:v", "high", ...BANDERAS_709,
      "-an", "-movflags", "+faststart", path.join(OUT, "hero-loop-1080.mp4"),
    ]),
  );
  paso("hero-loop-1080.webm (AV1)", () =>
    ff([
      "-loglevel", "error", "-i", fuente, "-vf", aWeb(1920),
      "-c:v", "libaom-av1", "-cpu-used", "6", "-row-mt", "1", "-tiles", "2x2", "-crf", "34", "-b:v", "0", ...BANDERAS_709,
      "-an", path.join(OUT, "hero-loop-1080.webm"),
    ]),
  );
}

function heroPesado(fuente: string) {
  paso("hero-loop-4k.webm (AV1)", () =>
    ff([
      "-loglevel", "error", "-i", fuente, "-vf", aWeb(),
      "-c:v", "libaom-av1", "-cpu-used", "8", "-row-mt", "1", "-tiles", "4x2", "-crf", "32", "-b:v", "0", ...BANDERAS_709,
      "-an", path.join(OUT, "hero-loop-4k.webm"),
    ]),
  );
}

/** Los tramos del spot, en orden por su primer cuadro, unidos con el demuxer concat (-c copy). */
function unirSpot() {
  const carpeta = path.join(OUT, "revision");
  const partes = readdirSync(carpeta)
    .filter((f) => /^spot-parte-\d+-\d+\.mp4$/.test(f))
    .sort((a, b) => Number(a.split("-")[2]) - Number(b.split("-")[2]));
  if (partes.length === 0) throw new Error("No hay tramos en out/revision/spot-parte-*.mp4");
  const lista = path.join(carpeta, "spot-partes.txt");
  writeFileSync(lista, partes.map((f) => `file '${path.join(carpeta, f).split(path.sep).join("/")}'`).join("\n"));
  paso(`uniendo ${partes.join(", ")}`, () =>
    ff(["-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", "-movflags", "+faststart", path.join(OUT, "spot-completo-4k-imagen.mp4")]),
  );
}

/** La copia de revisión del spot: 1080p, con audio y la marca de tiempo quemada (IBM Plex Mono). */
function pruebaSpot() {
  const fuente = path.join(OUT, "spot-completo-4k.mp4");
  if (!existsSync(fuente)) throw new Error("Falta out/spot-completo-4k.mp4: npm run entregas -- spot");
  // drawtext necesita la ruta con barras y los dos puntos escapados.
  const fuenteTipo = path.join(RAIZ, "public", "fonts", "IBMPlexMono-Regular.ttf").split(path.sep).join("/").replace(":", "\\:");
  const marca = `drawtext=fontfile='${fuenteTipo}':text='%{pts\\:hms} · %{n}':x=w-tw-40:y=34:fontsize=30:fontcolor=0xECECEE:box=1:boxcolor=0x0D0D0F:boxborderw=10`;
  paso("spot-prueba-1080.mp4", () =>
    ff([
      "-loglevel", "error", "-i", fuente, "-vf", `${aWeb(1920)},${marca}`,
      "-c:v", "libx264", "-preset", "medium", "-crf", "21", ...BANDERAS_709, "-c:a", "copy",
      "-movflags", "+faststart", path.join(OUT, "spot-prueba-1080.mp4"),
    ]),
  );
}

const SITIO = path.join(RAIZ, "..", "public");

/** El hero-loop para el sitio, en quvant-web/public/hero. */
async function webHero() {
  const hero = path.join(SITIO, "hero");
  mkdirSync(hero, { recursive: true });
  for (const archivo of ["hero-loop-1080.webm", "hero-loop-1080.mp4", "hero-loop-4k.webm"]) {
    const origen = path.join(OUT, archivo);
    if (!existsSync(origen)) throw new Error(`Falta out/${archivo}: npm run entregas -- hero`);
    copyFileSync(origen, path.join(hero, archivo));
  }
  await sharp(path.join(OUT, "revision", "hero-poster.png")).resize({ width: 1920 }).webp({ quality: 82 }).toFile(path.join(hero, "hero-poster.webp"));
  console.log("hero → public/hero");
}

/** El spot para el sitio, en quvant-web/public/spot. */
async function webSpot() {
  const spotWeb = path.join(SITIO, "spot");
  mkdirSync(spotWeb, { recursive: true });
  const fuente = path.join(OUT, "spot-completo-4k.mp4");
  if (!existsSync(fuente)) throw new Error("Falta out/spot-completo-4k.mp4: npm run entregas -- spot");
  const png = path.join(OUT, "revision", "spot-poster.png");
  ff(["-loglevel", "error", "-ss", "44", "-i", fuente, "-frames:v", "1", "-vf", "scale=in_range=pc:in_color_matrix=bt601,format=rgb24", png]);
  await sharp(png).resize({ width: 1600 }).webp({ quality: 82 }).toFile(path.join(spotWeb, "spot-poster.webp"));
  paso("spot-1080.mp4", () =>
    ff([
      "-loglevel", "error", "-i", fuente, "-vf", aWeb(1920),
      "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-profile:v", "high", ...BANDERAS_709,
      "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", path.join(spotWeb, "spot-1080.mp4"),
    ]),
  );
  paso("spot-1080.webm (AV1)", () =>
    ff([
      "-loglevel", "error", "-i", fuente, "-vf", aWeb(1920),
      "-c:v", "libaom-av1", "-cpu-used", "6", "-row-mt", "1", "-tiles", "2x2", "-crf", "36", "-b:v", "0", ...BANDERAS_709,
      "-c:a", "libopus", "-b:a", "128k", path.join(spotWeb, "spot-1080.webm"),
    ]),
  );
}

/** La música elegida: una de Pixabay Music si está, si no la compuesta en código. */
function musica() {
  for (const nombre of ["musica.wav", "musica.mp3", "musica-quvant.wav"]) {
    const archivo = path.join(AUDIO, nombre);
    if (existsSync(archivo)) return archivo;
  }
  throw new Error("Falta la música: npm run musica (o dejar assets/audio/musica.mp3)");
}

function spot() {
  const imagen = path.join(OUT, "spot-completo-4k-imagen.mp4");
  if (!existsSync(imagen)) throw new Error("Falta out/spot-completo-4k-imagen.mp4: el render mudo de SpotCompleto");
  const tic = path.join(AUDIO, "tic.wav");
  if (!existsSync(tic)) throw new Error("Falta assets/audio/tic.wav: npm run musica");

  const tiempos = aterrizajesSpot(60);
  const ms = tiempos.map((t) => Math.round(t * 1000));
  const grafo = (final: string) =>
    [
      `[2:a]volume=0.7,asplit=${ms.length}${ms.map((_, i) => `[t${i}]`).join("")}`,
      ...ms.map((m, i) => `[t${i}]adelay=${m}|${m}[d${i}]`),
      `[1:a]aresample=48000,atrim=0:45,afade=t=out:st=43.4:d=1.6[m]`,
      `[m]${ms.map((_, i) => `[d${i}]`).join("")}amix=inputs=${ms.length + 1}:normalize=0:duration=first[mezcla]`,
      `[mezcla]${final}[a]`,
    ].join(";");
  const entradas = ["-i", imagen, "-i", musica(), "-i", tic];

  // Primera pasada: medir la mezcla; la segunda normaliza en lineal con lo medido.
  let medida: Record<string, string> = {};
  paso("midiendo la mezcla", () => {
    medida = medirLoudnorm(entradas, grafo);
  });
  const segunda = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${medida.input_i}:measured_TP=${medida.input_tp}:measured_LRA=${medida.input_lra}:measured_thresh=${medida.input_thresh}:offset=${medida.target_offset}:linear=true,aresample=48000`;

  paso("spot-completo-4k.mp4", () =>
    ff([
      "-loglevel", "error", ...entradas, "-filter_complex", grafo(segunda),
      "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
      "-movflags", "+faststart", "-shortest", path.join(OUT, "spot-completo-4k.mp4"),
    ]),
  );
  paso("spot-completo-4k.webm (VP9)", () =>
    ff([
      "-loglevel", "error", ...entradas, "-filter_complex", grafo(segunda),
      "-map", "0:v", "-map", "[a]", "-vf", aWeb(),
      "-c:v", "libvpx-vp9", "-crf", "24", "-b:v", "0", "-deadline", "good", "-cpu-used", "4", "-row-mt", "1", "-tile-columns", "3", ...BANDERAS_709,
      "-c:a", "libopus", "-b:a", "192k", "-shortest", path.join(OUT, "spot-completo-4k.webm"),
    ]),
  );
}

/** Corre la primera pasada de loudnorm y devuelve lo medido (el json que ffmpeg escribe en stderr). */
function medirLoudnorm(entradas: string[], grafo: (f: string) => string): Record<string, string> {
  const r = spawnSync(
    ffmpeg!,
    ["-hide_banner", "-nostats", ...entradas, "-filter_complex", grafo("loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json"), "-map", "[a]", "-f", "null", "-"],
    { encoding: "utf-8", maxBuffer: 1 << 26 },
  );
  const texto = r.stderr ?? "";
  const json = texto.slice(texto.lastIndexOf("{"), texto.lastIndexOf("}") + 1);
  if (!json) throw new Error(`loudnorm no devolvió medidas:
${texto.slice(-2000)}`);
  return JSON.parse(json);
}

function documentos() {
  const fuente = path.join(RAIZ, "entregas");
  copyFileSync(path.join(fuente, "CREDITS.md"), path.join(OUT, "CREDITS.md"));
  const integracion = readFileSync(path.join(fuente, "INTEGRACION.md"), "utf-8").replace(/\{\{peso:([^}]+)\}\}/g, (_, archivo: string) => {
    const ruta = path.join(OUT, archivo);
    if (!existsSync(ruta)) return "–";
    const mb = statSync(ruta).size / 1024 / 1024;
    return mb < 1 ? `${Math.round(mb * 1024)} KB` : `${mb.toFixed(1).replace(".", ",")} MB`;
  });
  writeFileSync(path.join(OUT, "INTEGRACION.md"), integracion);
  console.log("CREDITS.md e INTEGRACION.md en out/");
}

async function main() {
  const que = process.argv[2];
  if (que === "hero") await hero();
  else if (que === "hero-1080") await hero({ liviano: true, pesado: false });
  else if (que === "hero-4k") await hero({ liviano: false, pesado: true });
  else if (que === "unir-spot") unirSpot();
  else if (que === "spot") spot();
  else if (que === "prueba-1080") pruebaSpot();
  else if (que === "web") {
    await webHero();
    await webSpot();
  } else if (que === "web-hero") await webHero();
  else if (que === "web-spot") await webSpot();
  else if (que !== "docs") throw new Error("Uso: npm run entregas -- hero | hero-1080 | hero-4k | unir-spot | spot | prueba-1080 | web | web-hero | web-spot | docs");
  documentos();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
