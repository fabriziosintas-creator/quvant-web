/**
 * npm run web-promo100 [-- out/promo100/promo-100-1080.mp4]
 *
 * Del render de Promo100 (16:9) a lo que sirve la web (public/promo100/
 * del sitio): un MP4 H.264 liviano, con la música de fondo si está
 * (out/promo100/musica-promo100.wav) y faststart, y un póster
 * .webp con la primera frase ("Se cortó internet. ¿Y ahora?"), que es lo
 * que se ve antes de tocar play. Sin WebM: con el grano de la imagen, el
 * VP9 salía más pesado que el MP4 (6,7 contra 4,8 MB) y el navegador lo
 * elegía primero. Los textos van quemados en la imagen, así que tampoco
 * se copia el .vtt.
 *
 * Usa ffmpeg-static (el ffmpeg que trae Remotion es mínimo).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const ENTRADA = process.argv[2] ?? "out/promo100/promo-100-1080.mp4";
const DESTINO = path.resolve(process.cwd(), "..", "public", "promo100");
const SEGUNDO_POSTER = 1.6;
const MUSICA = path.resolve(process.cwd(), "out", "promo100", "musica-promo100.wav");

function correr(args: string[]) {
  if (!ffmpeg) throw new Error("ffmpeg-static no encontró el binario");
  execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
}

const mb = (archivo: string) => (statSync(archivo).size / 1024 / 1024).toFixed(2) + " MB";

async function main() {
  mkdirSync(DESTINO, { recursive: true });
  const mp4 = path.join(DESTINO, "promo-100-1080.mp4");
  const poster = path.join(DESTINO, "promo-100-poster.webp");
  const cuadroPoster = path.join("out", "promo100", "promo-100-poster.png");

  correr([
    "-i", ENTRADA,
    ...(existsSync(MUSICA) ? ["-i", MUSICA, "-map", "0:v:0", "-map", "1:a:0", "-c:a", "aac", "-b:a", "128k", "-shortest"] : ["-an"]),
    "-c:v", "libx264", "-preset", "veryslow", "-crf", "24", "-tune", "animation",
    "-pix_fmt", "yuv420p", "-color_range", "tv", "-profile:v", "high",
    "-movflags", "+faststart",
    mp4,
  ]);
  console.log("mp4 ", mb(mp4));

  correr(["-ss", String(SEGUNDO_POSTER), "-i", ENTRADA, "-frames:v", "1", cuadroPoster]);
  await sharp(cuadroPoster).webp({ quality: 80 }).toFile(poster);
  console.log("póster", mb(poster));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
