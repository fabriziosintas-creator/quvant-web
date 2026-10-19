/**
 * npm run musica-2026
 *
 * La música del spot 2026, compuesta en código y cortada a su línea de
 * tiempo (src/spot2026/tiempos.ts): cada golpe cae en un corte de la
 * imagen. Electrónica a 120 BPM en fa menor (Fm · Db · Ab · Eb), con
 * diseño de sonido propio: la estática de la tele, el impacto cuando
 * engancha la señal, barridos en cada corte, subidas antes de cada drop y
 * el golpe final de la Q. Es una pieza original de Quvant: sin licencias
 * de terceros ni reclamos de derechos en redes.
 *
 * Cadena: síntesis (osciladores con polyBLEP, supersaw de 7 voces, bombo
 * con envolvente de tono, ruido filtrado) → buses → sidechain del bombo →
 * reverb (Freeverb) y delay ping-pong → compresión de mezcla → limitador
 * → ffmpeg loudnorm en dos pasadas a −14 LUFS y −1 dBTP (lo de redes).
 *
 * Salida: assets/audio/musica-2026.wav (48 kHz, estéreo, 24 bits).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";
import { BARRIDOS, DURACION, ETAPAS, PALABRAS_PARED, PALABRAS_PROBLEMA, PULSO, T } from "../src/spot2026/tiempos";

const SR = 48000;
const N = Math.ceil(SR * DURACION);

// ─────────────────────────────────────────────────────────── utilidades

function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const aleatorio = azar(20261019);
const ruido = () => aleatorio() * 2 - 1;
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const db = (x: number) => 10 ** (x / 20);
const muestra = (segundos: number) => Math.round(segundos * SR);

/** Biquad (RBJ). El corte se puede mover mientras suena. */
class Biquad {
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  constructor(
    private tipo: "lp" | "hp" | "bp",
    corte: number,
    private q = 0.707,
  ) {
    this.set(corte);
  }
  set(f: number, q = this.q) {
    this.q = q;
    const w = (2 * Math.PI * Math.min(Math.max(f, 15), SR * 0.45)) / SR;
    const alfa = Math.sin(w) / (2 * q);
    const c = Math.cos(w);
    const a0 = 1 + alfa;
    if (this.tipo === "lp") {
      this.b0 = (1 - c) / 2 / a0;
      this.b1 = (1 - c) / a0;
      this.b2 = this.b0;
    } else if (this.tipo === "hp") {
      this.b0 = (1 + c) / 2 / a0;
      this.b1 = -(1 + c) / a0;
      this.b2 = this.b0;
    } else {
      this.b0 = alfa / a0;
      this.b1 = 0;
      this.b2 = -alfa / a0;
    }
    this.a1 = (-2 * c) / a0;
    this.a2 = (1 - alfa) / a0;
  }
  paso(x: number) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

/** Corrección polyBLEP: saca el aliasing de los saltos del diente de sierra. */
function polyBlep(t: number, dt: number) {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

// ─────────────────────────────────────────────────────────── buses

type Bus = { L: Float32Array; R: Float32Array };
const bus = (): Bus => ({ L: new Float32Array(N), R: new Float32Array(N) });

const BUS = {
  bombo: bus(),
  bateria: bus(),
  /** Lo que se agacha con el bombo (bajo, acordes, arpegio, colchón). */
  armonia: bus(),
  efectos: bus(),
  envioReverb: bus(),
  envioDelay: bus(),
};

/** Suma una señal mono a un bus, con paneo de potencia constante. */
function sumar(destino: Bus, inicio: number, mono: Float32Array, ganancia = 1, paneo = 0) {
  const angulo = ((paneo + 1) * Math.PI) / 4;
  const gl = Math.cos(angulo) * ganancia * Math.SQRT2;
  const gr = Math.sin(angulo) * ganancia * Math.SQRT2;
  for (let i = 0; i < mono.length; i++) {
    const j = inicio + i;
    if (j < 0 || j >= N) continue;
    destino.L[j] += mono[i] * gl;
    destino.R[j] += mono[i] * gr;
  }
}

function sumarEstereo(destino: Bus, inicio: number, L: Float32Array, R: Float32Array, ganancia = 1) {
  for (let i = 0; i < L.length; i++) {
    const j = inicio + i;
    if (j < 0 || j >= N) continue;
    destino.L[j] += L[i] * ganancia;
    destino.R[j] += R[i] * ganancia;
  }
}

/** Manda la misma señal al bus y a los envíos de reverb y delay. */
function tocar(
  destino: Bus,
  t: number,
  mono: Float32Array,
  { gan = 1, pan = 0, reverb = 0, delay = 0 }: { gan?: number; pan?: number; reverb?: number; delay?: number } = {},
) {
  const inicio = muestra(t);
  sumar(destino, inicio, mono, gan, pan);
  if (reverb) sumar(BUS.envioReverb, inicio, mono, gan * reverb, pan);
  if (delay) sumar(BUS.envioDelay, inicio, mono, gan * delay, pan);
}

// ─────────────────────────────────────────────────────────── instrumentos

/** Envolvente ADSR muestreada. */
function adsr(n: number, a: number, d: number, s: number, r: number, nota: number) {
  const e = new Float32Array(n);
  const A = Math.max(1, muestra(a));
  const D = Math.max(1, muestra(d));
  const notaS = muestra(nota);
  const R = Math.max(1, muestra(r));
  let valor = 0;
  for (let i = 0; i < n; i++) {
    if (i < notaS) {
      if (i < A) valor = i / A;
      else if (i < A + D) valor = 1 - (1 - s) * ((i - A) / D);
      else valor = s;
    } else {
      const k = (i - notaS) / R;
      valor = k >= 1 ? 0 : valor * (1 - 1 / R) ** 1 * (1 - k) ** 0.0001;
      if (k >= 1) valor = 0;
    }
    e[i] = valor;
  }
  return e;
}

/** Supersaw: 7 dientes de sierra desafinados, en estéreo, por un pasabajos con envolvente. */
function supersaw(
  midi: number,
  dur: number,
  {
    ataque = 0.01,
    decay = 0.2,
    sustain = 0.7,
    release = 0.3,
    corte = 2400,
    corteEnv = 0,
    corteDecay = 0.25,
    q = 0.9,
    desafino = 0.16,
    voces = 7,
  } = {},
) {
  const n = muestra(dur + release + 0.05);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const env = adsr(n, ataque, decay, sustain, release, dur);
  const fL = new Biquad("lp", corte, q);
  const fR = new Biquad("lp", corte, q);
  const fases = Array.from({ length: voces }, () => aleatorio());
  const detunes = Array.from({ length: voces }, (_, v) => (voces === 1 ? 0 : ((v / (voces - 1)) * 2 - 1) * desafino));
  const base = hz(midi);
  for (let i = 0; i < n; i++) {
    if (i % 16 === 0) {
      const c = corte + corteEnv * Math.exp(-i / SR / corteDecay);
      fL.set(c);
      fR.set(c);
    }
    let l = 0;
    let r = 0;
    for (let v = 0; v < voces; v++) {
      const f = base * 2 ** (detunes[v] / 12);
      const dt = f / SR;
      fases[v] += dt;
      if (fases[v] >= 1) fases[v] -= 1;
      const saw = 2 * fases[v] - 1 - polyBlep(fases[v], dt);
      const lado = voces === 1 ? 0 : (v / (voces - 1)) * 2 - 1;
      l += saw * (0.5 - lado * 0.45);
      r += saw * (0.5 + lado * 0.45);
    }
    L[i] = fL.paso(l / voces) * env[i];
    R[i] = fR.paso(r / voces) * env[i];
  }
  return { L, R };
}

/** Un diente de sierra simple con filtro con envolvente (bajo y arpegio). */
function pulsado(midi: number, dur: number, { corte = 900, corteEnv = 2600, corteDecay = 0.12, q = 1.2, decay = 0.25, sustain = 0.25, release = 0.08, cuadrada = false } = {}) {
  const n = muestra(dur + release + 0.02);
  const out = new Float32Array(n);
  const env = adsr(n, 0.003, decay, sustain, release, dur);
  const filtro = new Biquad("lp", corte, q);
  const f = hz(midi);
  const dt = f / SR;
  let fase = aleatorio();
  for (let i = 0; i < n; i++) {
    if (i % 16 === 0) filtro.set(corte + corteEnv * Math.exp(-i / SR / corteDecay));
    fase += dt;
    if (fase >= 1) fase -= 1;
    let s = 2 * fase - 1 - polyBlep(fase, dt);
    if (cuadrada) {
      let f2 = fase + 0.5;
      if (f2 >= 1) f2 -= 1;
      s = s - (2 * f2 - 1 - polyBlep(f2, dt));
    }
    out[i] = filtro.paso(s) * env[i];
  }
  return out;
}

/** Seno con envolvente (el sub del bajo). */
function seno(midi: number, dur: number, { ataque = 0.005, release = 0.06 } = {}) {
  const n = muestra(dur + release);
  const out = new Float32Array(n);
  const env = adsr(n, ataque, 0.05, 1, release, dur);
  const f = hz(midi);
  for (let i = 0; i < n; i++) out[i] = Math.sin((2 * Math.PI * f * i) / SR) * env[i];
  return out;
}

/** Un piano eléctrico mínimo (FM de dos operadores), para el método. */
function campana(midi: number, dur: number) {
  const n = muestra(dur + 1.6);
  const out = new Float32Array(n);
  const f = hz(midi);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const indice = 1.6 * Math.exp(-t / 0.35);
    const mod = Math.sin(2 * Math.PI * f * 2 * t) * indice;
    const amp = Math.exp(-t / 0.9) * Math.min(1, t / 0.004);
    out[i] = (Math.sin(2 * Math.PI * f * t + mod) * 0.8 + Math.sin(2 * Math.PI * f * 2.001 * t) * 0.12 * Math.exp(-t / 0.3)) * amp;
  }
  return out;
}

/** El bombo: seno con caída de tono, el "click" del golpe y una saturación suave. */
function bombo(fuerte = 1) {
  const n = muestra(0.55);
  const out = new Float32Array(n);
  let fase = 0;
  const hp = new Biquad("hp", 1800, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 46 + 130 * Math.exp(-t / 0.032) + 40 * Math.exp(-t / 0.006);
    fase += f / SR;
    const cuerpo = Math.sin(2 * Math.PI * fase) * Math.exp(-t / 0.2) * Math.min(1, t / 0.0008);
    const click = hp.paso(ruido()) * Math.exp(-t / 0.0035) * 0.6;
    out[i] = Math.tanh((cuerpo + click) * 1.6 * fuerte) * 0.9;
  }
  return out;
}

/** El aplauso: tres ráfagas de ruido muy juntas y una cola corta. */
function aplauso() {
  const n = muestra(0.4);
  const out = new Float32Array(n);
  const bp = new Biquad("bp", 1250, 0.9);
  const hp = new Biquad("hp", 600, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let e = 0;
    for (const d of [0, 0.011, 0.022]) if (t >= d) e = Math.max(e, Math.exp(-(t - d) / 0.006));
    if (t >= 0.022) e = Math.max(e, 0.55 * Math.exp(-(t - 0.022) / 0.12));
    out[i] = hp.paso(bp.paso(ruido())) * e * 2.2;
  }
  return out;
}

/** Redoblante (para los redobles de subida). */
function redoble(fuerza = 1) {
  const n = muestra(0.22);
  const out = new Float32Array(n);
  const bp = new Biquad("bp", 2400, 0.6);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const tono = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t / 0.04);
    out[i] = (bp.paso(ruido()) * Math.exp(-t / 0.07) * 1.4 + tono * 0.5) * fuerza;
  }
  return out;
}

/** Platillo cerrado o abierto: ruido agudo con un cluster metálico. */
function hihat(abierto = false) {
  const n = muestra(abierto ? 0.4 : 0.09);
  const out = new Float32Array(n);
  const hp = new Biquad("hp", abierto ? 6500 : 8200, 0.8);
  const metales = [317, 461, 593, 739, 887, 1033].map((f) => f * 3.1);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let m = 0;
    for (const f of metales) m += Math.sign(Math.sin(2 * Math.PI * f * t));
    const e = Math.exp(-t / (abierto ? 0.16 : 0.028));
    out[i] = hp.paso(ruido() * 0.7 + (m / metales.length) * 0.5) * e;
  }
  return out;
}

/** Crash: ruido agudo con una cola larga. */
function crash() {
  const n = muestra(2.6);
  const out = new Float32Array(n);
  const hp = new Biquad("hp", 3800, 0.6);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = hp.paso(ruido()) * Math.exp(-t / 0.9) * Math.min(1, t / 0.002);
  }
  return out;
}

// ─────────────────────────────────────────────────────────── diseño de sonido

/** La estática de la tele: ruido de banda ancha, chasquidos y el zumbido de la línea. */
function estatica(dur: number) {
  const n = muestra(dur);
  const out = new Float32Array(n);
  const bp = new Biquad("bp", 2600, 0.45);
  const lp = new Biquad("lp", 5200, 0.7);
  let chasquido = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    if (aleatorio() < 0.0009) chasquido = 1;
    chasquido *= 0.985;
    const zumbido = (Math.sin(2 * Math.PI * 50 * t) * 0.5 + Math.sin(2 * Math.PI * 100 * t) * 0.3 + Math.sin(2 * Math.PI * 150 * t) * 0.15) * 0.35;
    // La señal "busca": el volumen tiembla como cuando se sintoniza.
    const temblor = 0.75 + 0.25 * Math.sin(2 * Math.PI * 7.3 * t) * Math.sin(2 * Math.PI * 0.9 * t);
    out[i] = lp.paso(bp.paso(ruido()) * 1.6 * temblor + chasquido * ruido() * 0.8) + zumbido * 0.4;
  }
  return out;
}

/** El golpe grave de un impacto: sub que cae, ruido y mucha reverb (la manda tocar). */
function impacto(largo = 1.6, fuerza = 1) {
  const n = muestra(largo);
  const out = new Float32Array(n);
  const lp = new Biquad("lp", 5000, 0.7);
  let fase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    if (i % 32 === 0) lp.set(200 + 6000 * Math.exp(-t / 0.08));
    const f = 30 + 55 * Math.exp(-t / 0.25);
    fase += f / SR;
    const sub = Math.sin(2 * Math.PI * fase) * Math.exp(-t / (largo * 0.45));
    const golpe = lp.paso(ruido()) * Math.exp(-t / 0.12);
    out[i] = Math.tanh((sub * 1.2 + golpe * 0.7) * fuerza);
  }
  return out;
}

/** Un barrido: ruido por un pasabanda que sube; termina justo en el corte. */
function barrido(dur = 0.42) {
  const n = muestra(dur + 0.25);
  const out = new Float32Array(n);
  const bp = new Biquad("bp", 400, 1.4);
  const corte = muestra(dur);
  for (let i = 0; i < n; i++) {
    const k = i / corte;
    if (i % 16 === 0) bp.set(i < corte ? 350 * 18 ** (k ** 1.6) : 6300 * Math.exp(-(i - corte) / SR / 0.05), 1.4);
    const amp = i < corte ? k ** 2.2 : Math.exp(-(i - corte) / SR / 0.07);
    out[i] = bp.paso(ruido()) * amp * 2.4;
  }
  return out;
}

/** Una subida: ruido que se abre y un diente de sierra que sube una octava. */
function subida(dur: number) {
  const n = muestra(dur);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const bpL = new Biquad("bp", 300, 0.9);
  const bpR = new Biquad("bp", 320, 0.9);
  let fase = 0;
  for (let i = 0; i < n; i++) {
    const k = i / n;
    if (i % 32 === 0) {
      bpL.set(250 * 32 ** k, 0.9);
      bpR.set(270 * 32 ** k, 0.9);
    }
    const f = hz(53) * 2 ** k;
    fase += f / SR;
    if (fase >= 1) fase -= 1;
    const amp = k ** 2.4;
    const saw = (2 * fase - 1) * 0.12;
    L[i] = (bpL.paso(ruido()) * 1.8 + saw) * amp;
    R[i] = (bpR.paso(ruido()) * 1.8 + saw) * amp;
  }
  return { L, R };
}

/** El "tic" de interfaz: muy corto y agudo. */
function tic(f = 2400) {
  const n = muestra(0.06);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.012) * 0.8 + ruido() * Math.exp(-t / 0.002) * 0.3;
  }
  return out;
}

// ─────────────────────────────────────────────────────────── armonía

/** Fm · Db · Ab · Eb, un acorde por compás. */
const ACORDES = [
  { raiz: 41, notas: [53, 56, 60, 65] },
  { raiz: 37, notas: [49, 53, 56, 61] },
  { raiz: 44, notas: [56, 60, 63, 68] },
  { raiz: 39, notas: [51, 55, 58, 63] },
];
const acordeEn = (t: number) => ACORDES[Math.floor(t / (PULSO * 4)) % 4];

function acorde(destino: Bus, t: number, dur: number, opciones: Parameters<typeof supersaw>[2], gan: number, reverb = 0.25, subir = 0) {
  for (const nota of acordeEn(t).notas) {
    const { L, R } = supersaw(nota + subir, dur, opciones);
    sumarEstereo(destino, muestra(t), L, R, gan);
    if (reverb) sumarEstereo(BUS.envioReverb, muestra(t), L, R, gan * reverb);
  }
}

// ─────────────────────────────────────────────────────────── arreglo

const pulsos = (desde: number, hasta: number, paso = PULSO) => {
  const lista: number[] = [];
  for (let t = desde; t < hasta - 1e-6; t += paso) lista.push(Number(t.toFixed(4)));
  return lista;
};

// 0–2 · La tele: estática; 2 · engancha.
tocar(BUS.efectos, T.tele, estatica(T.enganche - T.tele + 0.06), { gan: 0.2 });
tocar(BUS.efectos, T.enganche, impacto(2.2, 0.9), { gan: 0.75, reverb: 0.5 });
tocar(BUS.efectos, T.enganche, tic(3200), { gan: 0.5 });
// El acorde que se abre cuando aparece QUVANT nítido.
acorde(BUS.armonia, T.enganche, 1.85, { ataque: 0.02, decay: 1.2, sustain: 0.55, release: 1.4, corte: 1200, corteEnv: 3800, corteDecay: 0.6 }, 0.55, 0.6);

// 4–7,75 · El problema: arpegio que se abre, un golpe por palabra y una subida.
for (const t of pulsos(T.problema, T.respiro, PULSO / 4)) {
  const k = (t - T.problema) / (T.respiro - T.problema);
  const notas = acordeEn(t).notas;
  const paso = Math.round((t - T.problema) / (PULSO / 4));
  const nota = notas[[0, 2, 1, 3][paso % 4]] + 12;
  tocar(BUS.armonia, t, pulsado(nota, PULSO / 4 - 0.01, { corte: 300 + 2600 * k ** 1.5, corteEnv: 900, decay: 0.09, sustain: 0.15 }), {
    gan: 0.22 + 0.1 * k,
    pan: paso % 2 ? 0.35 : -0.35,
    delay: 0.25,
    reverb: 0.15,
  });
}
for (const p of PALABRAS_PROBLEMA) {
  tocar(BUS.bateria, p.t, bombo(p.grande ? 1.1 : 0.8), { gan: p.grande ? 0.85 : 0.6 });
  tocar(BUS.efectos, p.t, tic(p.grande ? 1800 : 2600), { gan: 0.35 });
  if (p.grande) acorde(BUS.armonia, p.t, 0.9, { decay: 0.4, sustain: 0.3, release: 0.6, corte: 1600, corteEnv: 4000, corteDecay: 0.2 }, 0.3, 0.4);
}
{
  const { L, R } = subida(T.respiro - T.problema);
  sumarEstereo(BUS.efectos, muestra(T.problema), L, R, 0.42);
}
pulsos(6.5, T.respiro, PULSO / 4).forEach((t, i, lista) => tocar(BUS.bateria, t, redoble(0.4 + (0.6 * i) / lista.length), { gan: 0.32, reverb: 0.1 }));

// 8–24 · El drop: bombo en negras, aplauso en 2 y 4, platillos, bajo a contratiempo, acordes y arpegio.
const DROP = [T.trabajos, T.metodo] as const;
function groove(desde: number, hasta: number, intensidad = 1) {
  for (const t of pulsos(desde, hasta)) {
    tocar(BUS.bombo, t, bombo(1), { gan: 0.66 });
    const enCompas = Math.round((t - desde) / PULSO) % 4;
    if (enCompas === 1 || enCompas === 3) tocar(BUS.bateria, t, aplauso(), { gan: 0.42 * intensidad, reverb: 0.22 });
    // Bajo a contratiempo: raíz y sub una octava abajo.
    const raiz = acordeEn(t).raiz;
    const tb = t + PULSO / 2;
    tocar(BUS.armonia, tb, pulsado(raiz, PULSO / 2 - 0.03, { corte: 320, corteEnv: 1800, corteDecay: 0.07, q: 1.4, decay: 0.12, sustain: 0.55 }), { gan: 0.27 });
    tocar(BUS.armonia, tb, seno(raiz - 12, PULSO / 2 - 0.04), { gan: 0.2 });
    // Platillos: cerrados en semicorcheas con acento, abierto a contratiempo.
    for (let s = 0; s < 4; s++) {
      const th = t + (s * PULSO) / 4;
      if (s === 2) tocar(BUS.bateria, th, hihat(true), { gan: 0.16 * intensidad, pan: 0.2 });
      else tocar(BUS.bateria, th, hihat(false), { gan: (s === 0 ? 0.1 : 0.16) * intensidad, pan: s % 2 ? 0.3 : -0.25 });
    }
  }
  // Acordes cortos en el "y" del 2 y del 4, y el arpegio en semicorcheas.
  for (const t of pulsos(desde, hasta, PULSO * 2)) {
    acorde(BUS.armonia, t + PULSO * 1.5, 0.16, { decay: 0.12, sustain: 0.2, release: 0.18, corte: 2400, corteEnv: 5600, corteDecay: 0.09 }, 0.44 * intensidad, 0.3);
  }
  for (const t of pulsos(desde, hasta, PULSO / 4)) {
    const paso = Math.round((t - desde) / (PULSO / 4));
    const notas = acordeEn(t).notas;
    const nota = notas[[0, 1, 2, 3, 2, 1, 3, 2][paso % 8]] + 12;
    tocar(BUS.armonia, t, pulsado(nota, PULSO / 4 - 0.015, { corte: 1100, corteEnv: 3800, corteDecay: 0.06, decay: 0.08, sustain: 0.1, cuadrada: paso % 8 > 3 }), {
      gan: 0.17 * intensidad,
      pan: Math.sin(paso * 0.9) * 0.6,
      delay: 0.35,
      reverb: 0.12,
    });
  }
}
groove(DROP[0], DROP[1]);
tocar(BUS.efectos, T.trabajos, impacto(1.4, 1), { gan: 0.7, reverb: 0.35 });
tocar(BUS.bateria, T.trabajos, crash(), { gan: 0.3, reverb: 0.3 });
// Un colchón por debajo de todo el drop.
for (const t of pulsos(T.trabajos, T.metodo, PULSO * 4)) {
  acorde(BUS.armonia, t, PULSO * 4 - 0.05, { ataque: 0.25, decay: 0.5, sustain: 0.8, release: 0.5, corte: 2400, desafino: 0.22 }, 0.17, 0.5);
}
// Un barrido antes de cada corte de trabajo y un golpe chico en el corte.
for (const t of BARRIDOS) {
  const d = barrido(0.42);
  tocar(BUS.efectos, t - 0.42, d, { gan: 0.3, pan: -0.2, reverb: 0.15 });
  if (t < T.metodo) tocar(BUS.efectos, t, impacto(0.6, 0.6), { gan: 0.32 });
}
// La pared: un acorde grande por palabra, y un crash al entrar.
tocar(BUS.bateria, T.pared, crash(), { gan: 0.28, reverb: 0.3 });
for (const p of PALABRAS_PARED) {
  acorde(BUS.armonia, p.t, 0.32, { decay: 0.25, sustain: 0.4, release: 0.4, corte: 2600, corteEnv: 5000, corteDecay: 0.12 }, 0.36, 0.45, 12);
}
// Redoble y respiro antes del método.
pulsos(T.metodo - 1, T.metodo - 0.25, PULSO / 4).forEach((t, i) => tocar(BUS.bateria, t, redoble(0.35 + i * 0.05), { gan: 0.28 }));

// 24–32 · El método: baja la intensidad. Colchón, piano eléctrico y un pulso suave.
tocar(BUS.efectos, T.metodo, impacto(1.8, 0.8), { gan: 0.55, reverb: 0.6 });
for (const t of pulsos(T.metodo, T.subida, PULSO * 4)) {
  acorde(BUS.armonia, t, PULSO * 4 - 0.02, { ataque: 0.35, decay: 0.8, sustain: 0.75, release: 1.2, corte: 2600, desafino: 0.2 }, 0.2, 0.7);
  tocar(BUS.armonia, t, seno(acordeEn(t).raiz - 12, PULSO * 4 - 0.1, { ataque: 0.2, release: 0.4 }), { gan: 0.14 });
}
const MELODIA = [72, 68, 65, 67, 68, 67, 65, 63, 65, 68, 72, 75, 73, 72, 68, 70];
pulsos(T.metodo, T.subida, PULSO).forEach((t, i) => {
  tocar(BUS.armonia, t, campana(MELODIA[i % MELODIA.length], PULSO * 0.9), { gan: 0.26, pan: i % 2 ? 0.25 : -0.25, delay: 0.3, reverb: 0.4 });
});
for (const t of pulsos(T.metodo, T.subida, PULSO)) {
  const enCompas = Math.round((t - T.metodo) / PULSO) % 4;
  if (enCompas === 0) tocar(BUS.bombo, t, bombo(0.7), { gan: 0.55 });
  tocar(BUS.bateria, t + PULSO / 2, hihat(false), { gan: 0.08, pan: 0.3 });
}
for (const e of ETAPAS) tocar(BUS.efectos, e.t, tic(2100), { gan: 0.28, reverb: 0.2 });

// 32–35,75 · Vuelve a subir: bombo que se acelera, arpegio que se abre, subida y redoble.
for (const t of pulsos(T.subida, T.firma - 0.25, PULSO)) tocar(BUS.bombo, t, bombo(0.9), { gan: 0.75 });
for (const t of pulsos(T.subida + 2, T.firma - 0.25, PULSO / 2)) tocar(BUS.bombo, t, bombo(0.6), { gan: 0.35 });
for (const t of pulsos(T.subida, T.firma - 0.25, PULSO / 4)) {
  const k = (t - T.subida) / (T.firma - T.subida);
  const paso = Math.round((t - T.subida) / (PULSO / 4));
  const nota = acordeEn(t).notas[[0, 2, 1, 3][paso % 4]] + 12;
  tocar(BUS.armonia, t, pulsado(nota, PULSO / 4 - 0.01, { corte: 400 + 4200 * k ** 1.4, corteEnv: 800, decay: 0.08, sustain: 0.12 }), {
    gan: 0.13 + 0.07 * k,
    pan: paso % 2 ? 0.4 : -0.4,
    delay: 0.3,
  });
}
{
  const { L, R } = subida(T.firma - T.subida - 0.25);
  sumarEstereo(BUS.efectos, muestra(T.subida), L, R, 0.48);
}
pulsos(T.firma - 1.5, T.firma - 0.25, PULSO / 8).forEach((t, i, lista) => tocar(BUS.bateria, t, redoble(0.3 + (0.7 * i) / lista.length), { gan: 0.3 }));

// 36 · La Q: el golpe final, un acorde abierto que se queda sonando y el tic del punto.
tocar(BUS.efectos, T.firma, impacto(3.2, 1.15), { gan: 0.6, reverb: 0.7 });
tocar(BUS.bombo, T.firma, bombo(1.2), { gan: 1 });
tocar(BUS.bateria, T.firma, crash(), { gan: 0.34, reverb: 0.5 });
acorde(BUS.armonia, T.firma, 3.6, { ataque: 0.005, decay: 1.6, sustain: 0.5, release: 2.2, corte: 2000, corteEnv: 6000, corteDecay: 0.35, desafino: 0.24 }, 0.5, 0.8);
acorde(BUS.armonia, T.firma, 3.6, { ataque: 0.005, decay: 1.6, sustain: 0.4, release: 2.2, corte: 3000, corteEnv: 4000, corteDecay: 0.5 }, 0.28, 0.8, 12);
tocar(BUS.armonia, T.firma, seno(29, 3.4, { ataque: 0.01, release: 1.2 }), { gan: 0.2 });
tocar(BUS.efectos, T.firma + 2.0, tic(2600), { gan: 0.4, reverb: 0.35 });
tocar(BUS.armonia, T.firma + 2.0, campana(77, 1.6), { gan: 0.12, reverb: 0.6, delay: 0.3 });

// ─────────────────────────────────────────────────────────── mezcla

// Sidechain: el bombo agacha la armonía (bajo, acordes, colchón) unos 120 ms.
const agacha = new Float32Array(N).fill(1);
{
  let env = 0;
  for (let i = 0; i < N; i++) {
    const nivel = Math.abs(BUS.bombo.L[i]) + Math.abs(BUS.bombo.R[i]);
    env = nivel > env ? nivel : env * Math.exp(-1 / (SR * 0.09));
    agacha[i] = 1 - Math.min(0.45, env * 0.5);
  }
  for (let i = 0; i < N; i++) {
    BUS.armonia.L[i] *= agacha[i];
    BUS.armonia.R[i] *= agacha[i];
  }
}

/** Freeverb (Jezar): 8 peines y 4 pasatodos por canal. */
function reverb(entrada: Bus, sala = 0.86, amortigua = 0.25, ancho = 1) {
  const escala = SR / 44100;
  const peines = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const pasatodos = [556, 441, 341, 225];
  const salida = bus();
  for (const [canal, extra] of [["L", 0], ["R", 23]] as const) {
    const x = entrada[canal];
    const y = salida[canal];
    const lineas = peines.map((d) => ({ buf: new Float32Array(Math.round((d + extra) * escala)), i: 0, filtro: 0 }));
    const pas = pasatodos.map((d) => ({ buf: new Float32Array(Math.round((d + extra) * escala)), i: 0 }));
    const pre = new Biquad("hp", 220, 0.7);
    for (let n = 0; n < N; n++) {
      const entradaN = pre.paso(x[n]) * 0.015;
      let suma = 0;
      for (const l of lineas) {
        const salidaL = l.buf[l.i];
        l.filtro = salidaL * (1 - amortigua) + l.filtro * amortigua;
        l.buf[l.i] = entradaN + l.filtro * sala;
        l.i = (l.i + 1) % l.buf.length;
        suma += salidaL;
      }
      for (const p of pas) {
        const b = p.buf[p.i];
        p.buf[p.i] = suma + b * 0.5;
        suma = b - suma;
        p.i = (p.i + 1) % p.buf.length;
      }
      y[n] = suma;
    }
  }
  if (ancho !== 1) {
    for (let n = 0; n < N; n++) {
      const m = (salida.L[n] + salida.R[n]) / 2;
      const s = ((salida.L[n] - salida.R[n]) / 2) * ancho;
      salida.L[n] = m + s;
      salida.R[n] = m - s;
    }
  }
  return salida;
}

/** Delay ping-pong a corchea con puntillo, con los repetidos cada vez más oscuros. */
function delayPingPong(entrada: Bus, tiempo = PULSO * 0.75, realim = 0.38) {
  const d = muestra(tiempo);
  const salida = bus();
  const lpL = new Biquad("lp", 3800, 0.7);
  const lpR = new Biquad("lp", 3800, 0.7);
  for (let n = 0; n < N; n++) {
    const desdeR = n >= d ? salida.R[n - d] : 0;
    const desdeL = n >= d ? salida.L[n - d] : 0;
    salida.L[n] = lpL.paso((entrada.L[n] + entrada.R[n]) * 0.5 + desdeR * realim);
    salida.R[n] = lpR.paso(desdeL * realim);
  }
  return salida;
}

const rev = reverb(BUS.envioReverb, 0.87, 0.28, 1.15);
const del = delayPingPong(BUS.envioDelay);

const mezcla = bus();
const niveles: [Bus, number][] = [
  [BUS.bombo, 1],
  [BUS.bateria, 1],
  [BUS.armonia, 1],
  [BUS.efectos, 1],
  [rev, 1],
  [del, 0.55],
];
for (const [b, g] of niveles) {
  for (let n = 0; n < N; n++) {
    mezcla.L[n] += b.L[n] * g;
    mezcla.R[n] += b.R[n] * g;
  }
}

// El silencio antes del drop: un cuarto de pulso sin nada (la reverb también se corta).
for (const [desde, hasta] of [
  [T.respiro, T.trabajos],
  [T.firma - 0.25, T.firma],
] as const) {
  const a = muestra(desde);
  const b = muestra(hasta);
  for (let n = a; n < b; n++) {
    const k = Math.min(1, (n - a) / muestra(0.02));
    mezcla.L[n] *= 1 - k * 0.97;
    mezcla.R[n] *= 1 - k * 0.97;
  }
}

// Master: pasaaltos a 28 Hz, compresión de mezcla suave y limitador.
{
  const hpL = new Biquad("hp", 28, 0.7);
  const hpR = new Biquad("hp", 28, 0.7);
  let env = 0;
  const umbral = db(-12);
  for (let n = 0; n < N; n++) {
    const l = hpL.paso(mezcla.L[n]);
    const r = hpR.paso(mezcla.R[n]);
    const nivel = Math.max(Math.abs(l), Math.abs(r));
    const coef = nivel > env ? Math.exp(-1 / (SR * 0.008)) : Math.exp(-1 / (SR * 0.15));
    env = coef * env + (1 - coef) * nivel;
    const ganancia = env > umbral ? (umbral * (env / umbral) ** (1 / 2.2)) / env : 1;
    mezcla.L[n] = l * ganancia;
    mezcla.R[n] = r * ganancia;
  }
  // Final: fundido de la cola y saturación suave como limitador.
  const finDesde = muestra(DURACION - 1.2);
  let pico = 0;
  for (let n = 0; n < N; n++) pico = Math.max(pico, Math.abs(mezcla.L[n]), Math.abs(mezcla.R[n]));
  const pre = 0.98 / pico;
  for (let n = 0; n < N; n++) {
    const cola = n > finDesde ? Math.cos(((n - finDesde) / (N - finDesde)) * (Math.PI / 2)) : 1;
    mezcla.L[n] = Math.tanh(mezcla.L[n] * pre * 1.3) * 0.94 * cola;
    mezcla.R[n] = Math.tanh(mezcla.R[n] * pre * 1.3) * 0.94 * cola;
  }
}

// ─────────────────────────────────────────────────────────── archivo

function wav24(L: Float32Array, R: Float32Array) {
  const datos = L.length * 2 * 3;
  const b = Buffer.alloc(44 + datos);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + datos, 4);
  b.write("WAVE", 8);
  b.write("fmt ", 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 6, 28);
  b.writeUInt16LE(6, 32);
  b.writeUInt16LE(24, 34);
  b.write("data", 36);
  b.writeUInt32LE(datos, 40);
  let o = 44;
  for (let i = 0; i < L.length; i++) {
    for (const v of [L[i], R[i]]) {
      const s = Math.round(Math.max(-1, Math.min(1, v)) * 8388607);
      b.writeIntLE(s, o, 3);
      o += 3;
    }
  }
  return b;
}

const carpeta = path.join(process.cwd(), "assets", "audio");
mkdirSync(carpeta, { recursive: true });
const crudo = path.join(carpeta, "musica-2026-mezcla.wav");
writeFileSync(crudo, wav24(mezcla.L, mezcla.R));

// Loudnorm en dos pasadas: −14 LUFS integrados y −1 dBTP.
const ff = ffmpeg as unknown as string;
const medicion = spawnSync(ff, ["-hide_banner", "-i", crudo, "-af", "loudnorm=I=-14:TP=-1:LRA=9:print_format=json", "-f", "null", "-"], {
  encoding: "utf8",
});
const informe = medicion.stderr;
const m = JSON.parse(informe.slice(informe.lastIndexOf("{"), informe.lastIndexOf("}") + 1));
const final = path.join(carpeta, "musica-2026.wav");
execFileSync(ff, [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-i",
  crudo,
  "-af",
  `loudnorm=I=-14:TP=-1:LRA=9:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`,
  "-c:a",
  "pcm_s24le",
  final,
]);
console.log(`Música: ${final} (medida antes: ${m.input_i} LUFS, pico ${m.input_tp} dBTP)`);
