/**
 * npm run sonido-intro-web
 *
 * El sonido de la intro del logo de la web (src/componentes/estructura/
 * IntroTV.tsx): el nombre "sintoniza" durante 1,3 s y a los 1,45 s engancha
 * la señal. Se generan dos candidatos y se comparan con mediciones:
 *  - tele: una tele descompuesta (soplido de estática, el silbido de la
 *    sintonía, el zumbido de la línea) que al enganchar se corta con un
 *    golpe sordo y un "ping".
 *  - corto: un cable en corto (zumbido eléctrico a 100 Hz entrecortado y
 *    chispazos) que al enganchar hace un "zap".
 *
 * Los cortes de volumen de la estática copian los parpadeos del logo (el
 * mismo azar que IntroTV.tsx: sin(n·91,3)·437,1).
 *
 * Salida: los dos candidatos en assets/audio/ y el elegido en
 * ../public/sonidos/intro-logo.mp3 (−20 LUFS: es un sonido de interfaz).
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const SR = 48000;
const DURACION = 2.1;
const N = Math.round(SR * DURACION);
const BUSQUEDA = 1.3;
const ENGANCHE = 1.45;

/** El azar de IntroTV.tsx: el mismo número para el mismo instante. */
const azarLogo = (n: number) => {
  const s = Math.sin(n * 91.3) * 437.1;
  return s - Math.floor(s);
};

function generador(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Biquad {
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  private b = [1, 0, 0];
  private a = [0, 0];
  constructor(
    private tipo: "lp" | "hp" | "bp",
    f: number,
    private q = 0.707,
  ) {
    this.set(f);
  }
  set(f: number) {
    const w = (2 * Math.PI * Math.min(Math.max(f, 15), SR * 0.45)) / SR;
    const alfa = Math.sin(w) / (2 * this.q);
    const c = Math.cos(w);
    const a0 = 1 + alfa;
    if (this.tipo === "lp") this.b = [(1 - c) / 2 / a0, (1 - c) / a0, (1 - c) / 2 / a0];
    else if (this.tipo === "hp") this.b = [(1 + c) / 2 / a0, -(1 + c) / a0, (1 + c) / 2 / a0];
    else this.b = [alfa / a0, 0, -alfa / a0];
    this.a = [(-2 * c) / a0, (1 - alfa) / a0];
  }
  paso(x: number) {
    const y = this.b[0] * x + this.b[1] * this.x1 + this.b[2] * this.x2 - this.a[0] * this.y1 - this.a[1] * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

/** La envolvente de "buscar la señal": sube al prender, tiembla con los parpadeos del logo y se corta al enganchar. */
function busqueda(t: number) {
  if (t >= ENGANCHE) return 0;
  const prende = Math.min(1, t / 0.08);
  const parpadeo = azarLogo(Math.floor(t * 14) + 3) > 0.8 ? 0.35 : 1;
  const corte = t > ENGANCHE - 0.02 ? (ENGANCHE - t) / 0.02 : 1;
  return prende * parpadeo * corte;
}

function tele() {
  const L = new Float32Array(N);
  const R = new Float32Array(N);
  const r = generador(51);
  const bpL = new Biquad("bp", 3200, 0.45);
  const bpR = new Biquad("bp", 3400, 0.45);
  const lpL = new Biquad("lp", 6800);
  const lpR = new Biquad("lp", 6800);
  let fase = 0;
  let chasquido = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const e = busqueda(t);
    // El soplido de la estática, con el temblor de la sintonía.
    const temblor = 0.7 + 0.3 * Math.sin(2 * Math.PI * 7.3 * t);
    const soplidoL = lpL.paso(bpL.paso(r() * 2 - 1)) * 1.7 * temblor;
    const soplidoR = lpR.paso(bpR.paso(r() * 2 - 1)) * 1.7 * temblor;
    // El silbido de la sintonía: un tono que sube y vibra.
    const f = 900 + 1900 * (t / BUSQUEDA) ** 1.4 + 60 * Math.sin(2 * Math.PI * 5 * t);
    fase += f / SR;
    const silbido = Math.sin(2 * Math.PI * fase) * 0.05;
    // El zumbido de la línea y algún chasquido.
    const zumbido = (Math.sin(2 * Math.PI * 50 * t) * 0.5 + Math.sin(2 * Math.PI * 150 * t) * 0.25) * 0.05;
    if (r() < 0.0012) chasquido = 1;
    chasquido *= 0.982;
    const pop = chasquido * (r() * 2 - 1) * 0.5;
    L[i] = (soplidoL + silbido + zumbido + pop) * e;
    R[i] = (soplidoR + silbido + zumbido + pop) * e;
    // Engancha: golpe sordo, click y un "ping" que queda sonando.
    const d = t - ENGANCHE;
    if (d >= 0) {
      const golpe = Math.sin(2 * Math.PI * (70 + 60 * Math.exp(-d / 0.03)) * d) * Math.exp(-d / 0.12) * 0.7;
      const click = (r() * 2 - 1) * Math.exp(-d / 0.002) * 0.6;
      const ping = (Math.sin(2 * Math.PI * 2640 * d) * 0.6 + Math.sin(2 * Math.PI * 3960 * d) * 0.2) * Math.exp(-d / 0.22) * 0.22;
      L[i] += golpe + click + ping;
      R[i] += golpe + click + ping * 0.9;
    }
  }
  return { L, R };
}

function corto() {
  const L = new Float32Array(N);
  const R = new Float32Array(N);
  const r = generador(77);
  const hp = new Biquad("hp", 2500, 0.7);
  const bp = new Biquad("bp", 900, 1.2);
  let chispa = 0;
  let abierto = 1;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const e = busqueda(t);
    // El zumbido eléctrico: 100 Hz con armónicos, saturado y entrecortado.
    if (i % 240 === 0) abierto = r() > 0.35 ? 1 : 0.15;
    let zumbido = 0;
    for (let k = 1; k <= 9; k++) zumbido += Math.sin(2 * Math.PI * 100 * k * t) / k;
    zumbido = Math.tanh(zumbido * 2.2) * 0.32 * abierto;
    // Los chispazos: ráfagas de ruido muy agudas.
    if (r() < 0.0025) chispa = 1;
    chispa *= 0.993;
    const chispazo = hp.paso(r() * 2 - 1) * chispa * 0.9;
    const arco = bp.paso(r() * 2 - 1) * 0.25 * abierto;
    const s = (zumbido + chispazo + arco) * e;
    L[i] = s;
    R[i] = s * 0.92 + chispazo * e * 0.08;
    // Engancha: el "zap" (ruido con un tono que cae).
    const d = t - ENGANCHE;
    if (d >= 0) {
      const zap = (Math.sin(2 * Math.PI * (2200 * Math.exp(-d / 0.05) + 120) * d) * 0.5 + (r() * 2 - 1) * 0.5) * Math.exp(-d / 0.09) * 0.7;
      L[i] += zap;
      R[i] += zap;
    }
  }
  return { L, R };
}

function wav16(L: Float32Array, R: Float32Array) {
  const b = Buffer.alloc(44 + L.length * 4);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + L.length * 4, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 4, 28);
  b.writeUInt16LE(4, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(L.length * 4, 40);
  // Un fundido de 30 ms al final para que no corte en seco.
  const fin = Math.round(SR * 0.03);
  for (let i = 0; i < L.length; i++) {
    const f = i > L.length - fin ? (L.length - i) / fin : 1;
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * f)) * 32767), 44 + i * 4);
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * f)) * 32767), 46 + i * 4);
  }
  return b;
}

const ff = ffmpeg as unknown as string;
const carpeta = path.resolve("assets", "audio");
mkdirSync(carpeta, { recursive: true });

/** Normaliza a −20 LUFS con pico −3 dBTP y devuelve las mediciones del resultado. */
function normalizarYMedir(nombre: string, { L, R }: { L: Float32Array; R: Float32Array }) {
  const crudo = path.join(carpeta, `intro-${nombre}-crudo.wav`);
  const final = path.join(carpeta, `intro-${nombre}.wav`);
  writeFileSync(crudo, wav16(L, R));
  const informe = spawnSync(ff, ["-hide_banner", "-i", crudo, "-af", "loudnorm=I=-20:TP=-3:LRA=7:print_format=json", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const m = JSON.parse(informe.slice(informe.lastIndexOf("{"), informe.lastIndexOf("}") + 1));
  spawnSync(ff, [
    "-hide_banner", "-loglevel", "error", "-y", "-i", crudo,
    "-af", `loudnorm=I=-20:TP=-3:LRA=7:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`,
    final,
  ]);
  // Bandas: graves, cuerpo, la zona que cansa el oído (2–5 kHz) y aire.
  const banda = (filtro: string) => {
    const s = spawnSync(ff, ["-hide_banner", "-i", final, "-af", `${filtro},astats=metadata=0:measure_overall=RMS_level+Peak_level+Crest_factor`, "-f", "null", "-"], { encoding: "utf8" }).stderr;
    const rms = /RMS level dB: (-?[\d.]+|-inf)/g;
    let ultimo = "";
    for (const x of s.matchAll(rms)) ultimo = x[1];
    return Number(ultimo);
  };
  const total = spawnSync(ff, ["-hide_banner", "-i", final, "-af", "astats=metadata=0", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const cresta = [...total.matchAll(/Crest factor: ([\d.]+)/g)].pop()?.[1];
  return {
    nombre,
    final,
    graves: banda("lowpass=f=200"),
    cuerpo: banda("highpass=f=200,lowpass=f=2000"),
    molesto: banda("highpass=f=2000,lowpass=f=5000"),
    aire: banda("highpass=f=5000"),
    cresta: Number(cresta),
  };
}

const resultados = [normalizarYMedir("tele", tele()), normalizarYMedir("corto", corto())];
for (const r of resultados) {
  console.log(
    `${r.nombre.padEnd(6)} graves ${r.graves.toFixed(1)} · cuerpo ${r.cuerpo.toFixed(1)} · 2–5 kHz ${r.molesto.toFixed(1)} · aire ${r.aire.toFixed(1)} dB RMS · factor de cresta ${r.cresta.toFixed(1)}`,
  );
}

// El elegido (ver el razonamiento en IntroTV.tsx): se deja en la web como mp3, que todo navegador decodifica.
const elegido = process.argv[2] ?? "tele";
const origen = resultados.find((r) => r.nombre === elegido)!.final;
const web = path.resolve("..", "public", "sonidos");
mkdirSync(web, { recursive: true });
spawnSync(ff, ["-hide_banner", "-loglevel", "error", "-y", "-i", origen, "-c:a", "libmp3lame", "-b:a", "128k", path.join(web, "intro-logo.mp3")]);
copyFileSync(origen, path.join(carpeta, "intro-elegido.wav"));
console.log(`Elegido: ${elegido} → public/sonidos/intro-logo.mp3`);
