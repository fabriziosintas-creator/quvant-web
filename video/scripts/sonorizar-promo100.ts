/**
 * npm run sonorizar-promo100
 *
 * Le pone la música (out/promo100/musica-promo100.wav, de
 * npm run musica-promo100) a los videos de "Primeros 100" sin volver a
 * renderizar la imagen: copia el video tal cual y solo agrega el audio.
 *
 *   · el de la web (../public/promo100/promo-100-1080.mp4): se reemplaza
 *     en el lugar, con audio AAC de 128 kbps y faststart;
 *   · el vertical para Reels y Stories (out/promo100/promo-100-vertical.mp4):
 *     queda al lado como promo-100-vertical-con-musica.mp4, AAC de 192 kbps.
 *
 * Se puede correr las veces que haga falta: siempre toma solo la imagen
 * del video y le pone la música actual. Si el video ya tenía audio, lo
 * reemplaza. El video de la web nunca arranca solo con sonido: tiene
 * controles y se reproduce al tocar play.
 *
 * Usa ffmpeg-static (el ffmpeg que trae Remotion es mínimo).
 */
import { execFileSync } from "node:child_process";
import { existsSync, renameSync, statSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const MUSICA = path.resolve(process.cwd(), "out", "promo100", "musica-promo100.wav");
const WEB = path.resolve(process.cwd(), "..", "public", "promo100", "promo-100-1080.mp4");
const VERTICAL = path.resolve(process.cwd(), "out", "promo100", "promo-100-vertical.mp4");
const VERTICAL_CON_MUSICA = path.resolve(process.cwd(), "out", "promo100", "promo-100-vertical-con-musica.mp4");

const mb = (archivo: string) => (statSync(archivo).size / 1024 / 1024).toFixed(2) + " MB";

function sonorizar(video: string, salida: string, kbps: number) {
  if (!ffmpeg) throw new Error("ffmpeg-static no encontró el binario");
  const temporal = salida + ".tmp.mp4";
  execFileSync(
    ffmpeg,
    ["-hide_banner", "-loglevel", "error", "-y", "-i", video, "-i", MUSICA, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", `${kbps}k`, "-ar", "48000", "-shortest", "-movflags", "+faststart", temporal],
    { stdio: "inherit" },
  );
  renameSync(temporal, salida);
  console.log(`${path.relative(process.cwd(), salida)}  ${mb(salida)}`);
}

if (!existsSync(MUSICA)) throw new Error("Falta la música: corré antes npm run musica-promo100");
let hecho = false;
if (existsSync(WEB)) {
  sonorizar(WEB, WEB, 128);
  hecho = true;
} else {
  console.log("Sin video de la web en public/promo100/: salteado.");
}
if (existsSync(VERTICAL)) {
  sonorizar(VERTICAL, VERTICAL_CON_MUSICA, 192);
  hecho = true;
} else {
  console.log("Sin render vertical en out/promo100/ (npm run render-promo100-vertical): salteado.");
}
if (!hecho) process.exit(1);
