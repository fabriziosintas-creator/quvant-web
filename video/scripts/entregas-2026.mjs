/**
 * npm run entregas-2026
 *
 * Junta la imagen del spot 2026 (out/spot2026/spot2026-imagen.mp4, el
 * render de Remotion) con la música (assets/audio/musica-2026.wav) y deja
 * las entregas de la web en ../public/spot/:
 *  - spot-1080.mp4: H.264 High + AAC 192 kb/s, con faststart (todo navegador).
 *  - spot-1080.webm: VP9 + Opus 160 kb/s, más liviano.
 *  - spot-poster.webp: el cuadro de la firma (segundo 40).
 */
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const imagen = path.resolve("out", "spot2026", "spot2026-imagen.mp4");
const musica = path.resolve("assets", "audio", "musica-2026.wav");
const destino = path.resolve("..", "public", "spot");

const correr = (args) => execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });

correr([
  "-i", imagen, "-i", musica,
  "-map", "0:v", "-map", "1:a",
  "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "23", "-maxrate", "5M", "-bufsize", "10M", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k",
  "-movflags", "+faststart", "-shortest",
  path.join(destino, "spot-1080.mp4"),
]);

correr([
  "-i", imagen, "-i", musica,
  "-map", "0:v", "-map", "1:a",
  "-c:v", "libvpx-vp9", "-b:v", "3M", "-crf", "36", "-maxrate", "4M", "-bufsize", "8M", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p",
  "-c:a", "libopus", "-b:a", "160k",
  "-shortest",
  path.join(destino, "spot-1080.webm"),
]);

correr(["-ss", "40", "-i", imagen, "-frames:v", "1", "-c:v", "libwebp", "-quality", "82", path.join(destino, "spot-poster.webp")]);

for (const archivo of ["spot-1080.mp4", "spot-1080.webm", "spot-poster.webp"]) {
  console.log(archivo, `${(statSync(path.join(destino, archivo)).size / 1024 / 1024).toFixed(2)} MB`);
}
