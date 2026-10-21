/**
 * npm run promo100-vtt
 *
 * Los subtítulos del video de "Primeros 100" en WebVTT, desde el mismo
 * guion que la imagen (src/promo100/guion.ts). Salen en
 * out/promo100/promo-100.es.vtt; con el video listo se copian a
 * ../public/promo100/ junto al MP4.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { subtitulosAbsolutos } from "../src/promo100/guion";

const hora = (segundos: number) => {
  const ms = Math.round(segundos * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const resto = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(resto).padStart(3, "0")}`;
};

const lineas = ["WEBVTT", ""];
subtitulosAbsolutos().forEach((s, i) => {
  lineas.push(String(i + 1), `${hora(s.desde)} --> ${hora(s.hasta)}`, s.texto, "");
});

const carpeta = path.resolve("out", "promo100");
mkdirSync(carpeta, { recursive: true });
const destino = path.join(carpeta, "promo-100.es.vtt");
writeFileSync(destino, lineas.join("\n"));
console.log("listo", destino);
