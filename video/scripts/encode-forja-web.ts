/**
 * npm run web-forja [-- out/forja-recorrido.mp4]
 *
 * Del render de ForjaRecorrido a lo que sirve la web (public/forja/ del
 * sitio): un MP4 H.264 y un WebM VP9 livianos, sin audio, con faststart, y
 * un póster .webp (un cuadro de los racks en 3D con el detalle de uno,
 * que es lo que se ve en vista texto y antes de que cargue el video).
 *
 * Usa ffmpeg-static (el ffmpeg que trae Remotion es mínimo).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const ENTRADA = process.argv[2] ?? "out/forja-recorrido.mp4";
const DESTINO = path.resolve(process.cwd(), "..", "public", "forja");
const SEGUNDO_POSTER = 21.0;

function correr(args: string[]) {
  if (!ffmpeg) throw new Error("ffmpeg-static no encontró el binario");
  execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
}

const mb = (archivo: string) => (statSync(archivo).size / 1024 / 1024).toFixed(2) + " MB";

async function main() {
  mkdirSync(DESTINO, { recursive: true });
  const mp4 = path.join(DESTINO, "forja-recorrido.mp4");
  const webm = path.join(DESTINO, "forja-recorrido.webm");
  const poster = path.join(DESTINO, "forja-poster.webp");
  const cuadroPoster = path.join("out", "forja-poster.png");

  correr([
    "-i", ENTRADA, "-an",
    "-c:v", "libx264", "-preset", "veryslow", "-crf", "25", "-tune", "animation",
    "-pix_fmt", "yuv420p", "-color_range", "tv", "-profile:v", "high",
    "-movflags", "+faststart",
    mp4,
  ]);
  console.log("mp4 ", mb(mp4));

  correr([
    "-i", ENTRADA, "-an",
    "-c:v", "libvpx-vp9", "-crf", "35", "-b:v", "0", "-row-mt", "1",
    "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p",
    webm,
  ]);
  console.log("webm", mb(webm));

  correr(["-ss", String(SEGUNDO_POSTER), "-i", ENTRADA, "-frames:v", "1", cuadroPoster]);
  await sharp(cuadroPoster).webp({ quality: 78 }).toFile(poster);
  console.log("póster", mb(poster));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
