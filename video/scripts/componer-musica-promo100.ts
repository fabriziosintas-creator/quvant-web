/**
 * npm run musica-promo100
 *
 * La música del video de "Primeros 100", compuesta en código y cortada a
 * su guion (src/promo100/guion.ts): 42 s con tres capítulos de 13 s y un
 * cierre de 3. Pensada para un comerciante, no para un club: cálida,
 * liviana y con aire; que acompañe la pantalla sin taparla.
 *
 * Tempo: 13 s = 24 tiempos = 6 compases de 4, o sea 110,77 BPM. Así cada
 * capítulo empieza justo en un compás (0, 13 y 26 s: los saltos de los
 * botones de la web) y el cierre cae en el compás 19 (39 s).
 *
 * Forma de cada capítulo (la imagen manda):
 *   0 → 2,7 s   la frase grande: solo el colchón (pad) y un par de notas.
 *   2,7 → 9,8 s la pantalla: entra el ritmo (bombo suave, hi-hat, palmada),
 *               el bajo y el arpegio. Es lo que se mira, así que es lo más lleno.
 *   9,8 → 13 s  la línea que cierra: el ritmo respira, queda el colchón y el
 *               arpegio, y sube un barrido que desemboca en el golpe
 *               suave del capítulo que sigue.
 * Cierre (39 → 42 s): La menor → Do mayor, campanas sobre el acorde que
 * resuelve y fundido a silencio.
 *
 * Armonía: La menor, seis compases por capítulo (Am · F · C · G · F · G).
 * Termina en la dominante para que el capítulo siguiente "caiga" en Am.
 *
 * Cadena: síntesis (osciladores con polyBLEP, bombo con barrido de tono,
 * ruido filtrado, campanas FM) → buses → sidechain del bombo sobre pad y
 * bajo → reverb (Freeverb) y delay ping-pong → saturación suave →
 * ffmpeg loudnorm en dos pasadas a −14 LUFS y −1 dBTP (lo de redes).
 * Es una pieza original de Quvant: sin licencias de terceros ni
 * reclamos de derechos en redes. Determinista (misma semilla, mismo audio).
 *
 * Salida: out/promo100/musica-promo100.wav (48 kHz, estéreo, 24 bits).
 * Después, npm run sonorizar-promo100 se la pone a los videos.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";
import { CAPITULO, DURACION } from "../src/promo100/guion";

const SR = 48000;
const N = Math.ceil(SR * DURACION);
const TIEMPO = CAPITULO / 24; // un tiempo, en segundos
const BPM = 60 / TIEMPO;

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
const aleatorio = azar(20261022);
const ruido = () => aleatorio() * 2 - 1;
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const suave = (x: number) => {
  const a = Math.min(1, Math.max(0, x));
  return a * a * (3 - 2 * a);
};

/** Filtro biquad (RBJ). */
class Biquad {
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  ajustar(tipo: "paso-bajo" | "paso-alto" | "banda", f: number, q = 0.707) {
    const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR;
    const c = Math.cos(w);
    const al = Math.sin(w) / (2 * q);
    let b0: number;
    let b1: number;
    let b2: number;
    if (tipo === "paso-bajo") {
      b0 = (1 - c) / 2;
      b1 = 1 - c;
      b2 = (1 - c) / 2;
    } else if (tipo === "paso-alto") {
      b0 = (1 + c) / 2;
      b1 = -(1 + c);
      b2 = (1 + c) / 2;
    } else {
      b0 = al;
      b1 = 0;
      b2 = -al;
    }
    const a0 = 1 + al;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * c) / a0;
    this.a2 = (1 - al) / a0;
    return this;
  }
  p(x: number) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

/** Corrección de la sierra (polyBLEP): sin el "pitido" del aliasing. */
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

type Bus = { L: Float32Array; R: Float32Array };
const bus = (): Bus => ({ L: new Float32Array(N), R: new Float32Array(N) });
const colchon = bus(); // pad + bajo: se agacha con el bombo
const directo = bus(); // lo demás
const envioReverb = new Float32Array(N);
const envioDelay = new Float32Array(N);
const bombos: number[] = [];

function poner(destino: Bus, i: number, x: number, izquierda = 0.5) {
  if (i < 0 || i >= N) return;
  destino.L[i] += x * Math.sqrt(izquierda * 2) * 0.7071;
  destino.R[i] += x * Math.sqrt((1 - izquierda) * 2) * 0.7071;
}

// ─────────────────────────────────────────────────────────── instrumentos

/** Colchón: tres sierras apenas desafinadas por nota, filtradas, abiertas al estéreo. */
function pad(t0: number, duracion: number, notas: number[], vol: number, ataque: number, corte = 1300) {
  const liberacion = 0.8;
  const i0 = Math.floor(t0 * SR);
  const i1 = Math.min(N, Math.floor((t0 + duracion + liberacion) * SR));
  const desafinacion = [-0.1, 0, 0.1];
  const izquierda = [0.8, 0.5, 0.2];
  for (let v = 0; v < 3; v++) {
    const filtro = new Biquad().ajustar("paso-bajo", corte, 0.6);
    const fases = notas.map((_, k) => (v * 0.37 + k * 0.21) % 1);
    const pasos = notas.map((n) => hz(n + desafinacion[v]) / SR);
    for (let i = i0; i < i1; i++) {
      const t = (i - i0) / SR;
      const sube = suave(t / ataque);
      const baja = t < duracion ? 1 : Math.max(0, 1 - (t - duracion) / liberacion);
      let s = 0;
      for (let k = 0; k < notas.length; k++) {
        fases[k] += pasos[k];
        if (fases[k] >= 1) fases[k] -= 1;
        s += 2 * fases[k] - 1 - polyBlep(fases[k], pasos[k]);
      }
      const y = filtro.p(s / notas.length) * sube * baja * vol;
      poner(colchon, i, y / 3, izquierda[v]);
      envioReverb[i] += y * 0.05;
    }
  }
}

/** Bajo: seno con un poco de armónico, ataque corto. */
function bajo(t0: number, duracion: number, midi: number, vol: number) {
  const f = hz(midi);
  const i0 = Math.floor(t0 * SR);
  const i1 = Math.min(N, Math.floor((t0 + duracion + 0.15) * SR));
  let fase = 0;
  for (let i = i0; i < i1; i++) {
    const t = (i - i0) / SR;
    const env = Math.min(1, t / 0.008) * (t < duracion ? 1 : Math.max(0, 1 - (t - duracion) / 0.15)) * (0.75 + 0.25 * Math.exp(-t / 0.4));
    fase += (2 * Math.PI * f) / SR;
    poner(colchon, i, (Math.sin(fase) + 0.42 * Math.sin(2 * fase) + 0.12 * Math.sin(3 * fase)) * env * vol);
  }
}

/** Bombo suave: seno que baja de tono, con un clic mínimo. */
function bombo(t0: number, vol: number) {
  bombos.push(t0);
  const i0 = Math.floor(t0 * SR);
  let fase = 0;
  for (let i = i0; i < Math.min(N, i0 + Math.floor(0.45 * SR)); i++) {
    const t = (i - i0) / SR;
    fase += (2 * Math.PI * (46 + 95 * Math.exp(-t / 0.035))) / SR;
    const env = Math.exp(-t / 0.15) * Math.min(1, t / 0.002);
    poner(directo, i, (Math.sin(fase) * env + ruido() * Math.exp(-t / 0.004) * 0.12) * vol);
  }
}

/** Hi-hat cerrado: ruido agudo y corto. */
function hat(t0: number, vol: number, izquierda: number) {
  const filtro = new Biquad().ajustar("paso-alto", 7500, 0.8);
  const i0 = Math.floor(t0 * SR);
  for (let i = i0; i < Math.min(N, i0 + Math.floor(0.12 * SR)); i++) {
    const t = (i - i0) / SR;
    poner(directo, i, filtro.p(ruido()) * Math.exp(-t / 0.028) * vol, izquierda);
  }
}

/** Palmada suave (tiempos 2 y 4): ruido en banda más un cuerpo corto. */
function palmada(t0: number, vol: number) {
  const filtro = new Biquad().ajustar("banda", 1900, 0.9);
  const i0 = Math.floor(t0 * SR);
  let fase = 0;
  for (let i = i0; i < Math.min(N, i0 + Math.floor(0.3 * SR)); i++) {
    const t = (i - i0) / SR;
    fase += (2 * Math.PI * 195) / SR;
    const x = filtro.p(ruido()) * Math.exp(-t / 0.07) * 1.6 + Math.sin(fase) * Math.exp(-t / 0.05) * 0.5;
    poner(directo, i, x * vol);
    envioReverb[i] += x * vol * 0.35;
  }
}

/** Nota pulsada (arpegio): fundamental con dos armónicos que se apagan rápido. */
function pulsada(t0: number, midi: number, vol: number, izquierda: number, envioEco = 0.35) {
  const f = hz(midi);
  const filtro = new Biquad().ajustar("paso-bajo", 3600, 0.7);
  const i0 = Math.floor(t0 * SR);
  let fase = 0;
  for (let i = i0; i < Math.min(N, i0 + Math.floor(0.9 * SR)); i++) {
    const t = (i - i0) / SR;
    fase += (2 * Math.PI * f) / SR;
    const env = Math.min(1, t / 0.003) * Math.exp(-t / 0.2);
    const x = filtro.p(Math.sin(fase) + 0.35 * Math.sin(2 * fase) * Math.exp(-t / 0.12) + 0.14 * Math.sin(3 * fase) * Math.exp(-t / 0.06)) * env * vol;
    poner(directo, i, x, izquierda);
    envioReverb[i] += x * 0.3;
    envioDelay[i] += x * envioEco;
  }
}

/** Campana: modulación de frecuencia con relación inarmónica; suena largo. */
function campana(t0: number, midi: number, vol: number, izquierda: number) {
  const f = hz(midi);
  const i0 = Math.floor(t0 * SR);
  let fp = 0;
  let fm = 0;
  for (let i = i0; i < Math.min(N, i0 + Math.floor(2.4 * SR)); i++) {
    const t = (i - i0) / SR;
    fm += (2 * Math.PI * f * 3.5) / SR;
    fp += (2 * Math.PI * f) / SR;
    const indice = 2.4 * Math.exp(-t / 0.35);
    const env = Math.min(1, t / 0.002) * Math.exp(-t / 0.9);
    const x = Math.sin(fp + indice * Math.sin(fm)) * env * vol;
    poner(directo, i, x, izquierda);
    envioReverb[i] += x * 0.55;
    envioDelay[i] += x * 0.25;
  }
}

/** Barrido de ruido que sube hasta el golpe del capítulo que sigue. */
function barrido(t0: number, duracion: number, vol: number) {
  const filtro = new Biquad();
  const i0 = Math.floor(t0 * SR);
  const i1 = Math.min(N, Math.floor((t0 + duracion) * SR));
  for (let i = i0; i < i1; i++) {
    const a = (i - i0) / (i1 - i0);
    if ((i - i0) % 64 === 0) filtro.ajustar("paso-alto", 300 * 30 ** a, 1.1);
    const x = filtro.p(ruido()) * suave(a) ** 1.5 * vol;
    poner(directo, i, x, 0.5 + 0.3 * Math.sin(a * 9));
    envioReverb[i] += x * 0.25;
  }
}

/** Golpe suave de cambio de capítulo: un "bum" grave y un soplido que se va. */
function golpe(t0: number, vol: number) {
  const filtro = new Biquad().ajustar("paso-bajo", 5200, 0.7);
  const i0 = Math.floor(t0 * SR);
  let fase = 0;
  for (let i = i0; i < Math.min(N, i0 + Math.floor(1.8 * SR)); i++) {
    const t = (i - i0) / SR;
    fase += (2 * Math.PI * (38 + 30 * Math.exp(-t / 0.25))) / SR;
    const bum = Math.sin(fase) * Math.exp(-t / 0.55) * 0.5;
    const soplido = filtro.p(ruido()) * Math.exp(-t / 0.5) * 0.22;
    poner(directo, i, (bum + soplido) * vol);
    envioReverb[i] += soplido * vol * 0.6;
  }
}

// ─────────────────────────────────────────────────────────── la pieza

// Acordes (notas MIDI) y la fundamental del bajo.
const ACORDES: Record<string, { notas: number[]; bajo: number }> = {
  Am: { notas: [57, 60, 64, 67], bajo: 45 },
  F: { notas: [53, 57, 60, 64], bajo: 41 },
  C: { notas: [55, 60, 64, 67], bajo: 48 },
  G: { notas: [55, 59, 62, 67], bajo: 43 },
};
const CAPITULO_ACORDES = ["Am", "F", "C", "G", "F", "G"];
// Qué nota del acorde suena en cada corchea del compás.
const ARPEGIO = [0, 1, 2, 3, 2, 1, 2, 3];
const GROOVE_DESDE = 5; // tiempo del capítulo en que entra la pantalla (≈ 2,7 s)
const GROOVE_HASTA = 18; // y en que la línea de cierre hace respirar el ritmo (≈ 9,8 s)

for (let k = 0; k < 3; k++) {
  const c0 = k * CAPITULO;
  const tiempo = (n: number) => c0 + n * TIEMPO;

  // Colchón y bajo, un compás por acorde.
  CAPITULO_ACORDES.forEach((nombre, j) => {
    const acorde = ACORDES[nombre];
    const t = tiempo(j * 4);
    pad(t, 4 * TIEMPO, acorde.notas, 0.4, k === 0 && j === 0 ? 1.4 : 0.4);
    const enGroove = (n: number) => n >= GROOVE_DESDE && n < GROOVE_HASTA;
    if (enGroove(j * 4) || enGroove(j * 4 + 2.5)) {
      // Con la pantalla: bajo con síncopa (tiempo 1, "y" del 2 y 3 y medio).
      if (enGroove(j * 4)) bajo(tiempo(j * 4), 1.3 * TIEMPO, acorde.bajo, 0.4);
      if (enGroove(j * 4 + 1.5)) bajo(tiempo(j * 4 + 1.5), 0.8 * TIEMPO, acorde.bajo + 12, 0.22);
      if (enGroove(j * 4 + 2.5)) bajo(tiempo(j * 4 + 2.5), 1.3 * TIEMPO, acorde.bajo, 0.36);
    } else {
      // Con la frase o con el cierre: la fundamental sostenida, bajita.
      bajo(t, 3.8 * TIEMPO, acorde.bajo, 0.34);
    }
  });

  // Ritmo: solo mientras se mira la pantalla.
  for (let n = GROOVE_DESDE; n < GROOVE_HASTA; n++) {
    bombo(tiempo(n), 0.48);
    hat(tiempo(n + 0.5), 0.1, n % 2 === 0 ? 0.35 : 0.65);
    if (n % 4 === 1 || n % 4 === 3) palmada(tiempo(n), 0.13);
  }

  // Arpegio: sutil con la frase, lleno con la pantalla, más suave en el cierre.
  for (let paso = 0; paso < 48; paso++) {
    const n = paso * 0.5;
    const acorde = ACORDES[CAPITULO_ACORDES[Math.floor(n / 4)]];
    const nota = acorde.notas[ARPEGIO[paso % 8]] + 12;
    if (n < GROOVE_DESDE) {
      if (Number.isInteger(n) && n % 2 === 1 && n >= 1) pulsada(tiempo(n), nota, 0.07, 0.3, 0.45);
    } else if (n < GROOVE_HASTA) {
      pulsada(tiempo(n), nota, paso % 2 === 0 ? 0.12 : 0.085, 0.3 + 0.4 * ((paso % 4) / 3));
    } else {
      pulsada(tiempo(n), nota, 0.085, 0.3 + 0.4 * ((paso % 4) / 3), 0.5);
    }
  }

  // Del cierre del capítulo al golpe del siguiente.
  const fin = c0 + CAPITULO;
  barrido(fin - 1.9, 1.9, 0.2);
  golpe(fin, 0.7);
}

// ── Cierre (39 → 42 s): resuelve en Do mayor.
const T_CIERRE = 3 * CAPITULO;
pad(T_CIERRE, 2.6, [48, 55, 60, 64, 67, 72], 0.42, 0.25, 1700);
bajo(T_CIERRE, 2.6, 36, 0.55);
[
  [0.05, 72, 0.3],
  [0.45, 76, 0.26],
  [0.85, 79, 0.26],
  [1.25, 84, 0.22],
  [1.7, 72, 0.14],
].forEach(([dt, nota, vol], i) => campana(T_CIERRE + dt, nota, vol, i % 2 === 0 ? 0.35 : 0.65));

// ─────────────────────────────────────────────────────────── efectos y mezcla

// Sidechain: cada bombo agacha un poco el colchón.
const agache = new Float32Array(N).fill(1);
for (const t of bombos) {
  const i0 = Math.floor(t * SR);
  for (let i = i0; i < Math.min(N, i0 + Math.floor(0.4 * SR)); i++) {
    const g = 1 - 0.38 * Math.exp(-(i - i0) / SR / 0.1);
    if (g < agache[i]) agache[i] = g;
  }
}

/** Reverb Freeverb (8 peines + 4 pasatodo por canal). */
function reverb(entrada: Float32Array): Bus {
  const escala = SR / 44100;
  const peines = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const pasatodo = [556, 441, 341, 225];
  const salida = bus();
  [0, 23].forEach((separacion, canal) => {
    const bufPeines = peines.map((d) => new Float32Array(Math.round((d + separacion) * escala)));
    const posPeines = peines.map(() => 0);
    const filtroPeines = peines.map(() => 0);
    const bufPasa = pasatodo.map((d) => new Float32Array(Math.round((d + separacion) * escala)));
    const posPasa = pasatodo.map(() => 0);
    const destino = canal === 0 ? salida.L : salida.R;
    const realimentacion = 0.86;
    const amortiguacion = 0.42;
    for (let i = 0; i < N; i++) {
      const x = entrada[i] * 0.03;
      let suma = 0;
      for (let c = 0; c < bufPeines.length; c++) {
        const buf = bufPeines[c];
        const y = buf[posPeines[c]];
        filtroPeines[c] = y * (1 - amortiguacion) + filtroPeines[c] * amortiguacion;
        buf[posPeines[c]] = x + filtroPeines[c] * realimentacion;
        posPeines[c] = (posPeines[c] + 1) % buf.length;
        suma += y;
      }
      for (let a = 0; a < bufPasa.length; a++) {
        const buf = bufPasa[a];
        const y = buf[posPasa[a]];
        buf[posPasa[a]] = suma + y * 0.5;
        posPasa[a] = (posPasa[a] + 1) % buf.length;
        suma = y - suma;
      }
      destino[i] = suma;
    }
  });
  return salida;
}

/** Eco que rebota entre los dos lados, a tres cuartos de tiempo. */
function eco(entrada: Float32Array): Bus {
  const largo = Math.round(0.75 * TIEMPO * SR);
  const bufL = new Float32Array(largo);
  const bufR = new Float32Array(largo);
  const filtroL = new Biquad().ajustar("paso-bajo", 3200);
  const filtroR = new Biquad().ajustar("paso-bajo", 3200);
  const salida = bus();
  let pos = 0;
  for (let i = 0; i < N; i++) {
    const dl = bufL[pos];
    const dr = bufR[pos];
    bufL[pos] = entrada[i] + filtroR.p(dr) * 0.4;
    bufR[pos] = filtroL.p(dl) * 0.4;
    salida.L[i] = dl;
    salida.R[i] = dr;
    pos = (pos + 1) % largo;
  }
  return salida;
}

const rev = reverb(envioReverb);
const ecos = eco(envioDelay);
const mezcla = { L: new Float32Array(N), R: new Float32Array(N) };
// Sin el rumble de abajo de 32 Hz: no se oye en un celular y le gasta volumen al resto.
const quitarRumbleL = new Biquad().ajustar("paso-alto", 32);
const quitarRumbleR = new Biquad().ajustar("paso-alto", 32);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  // Entrada de 30 ms (sin clic) y fundido final de 1,1 s.
  const entrada = Math.min(1, t / 0.03);
  const salida = t > DURACION - 1.1 ? Math.cos(((t - (DURACION - 1.1)) / 1.1) * Math.PI * 0.5) ** 2 : 1;
  const g = entrada * salida;
  mezcla.L[i] = Math.tanh(quitarRumbleL.p(colchon.L[i] * agache[i] + directo.L[i] + rev.L[i] * 0.9 + ecos.L[i] * 0.5) * 0.9) * g;
  mezcla.R[i] = Math.tanh(quitarRumbleR.p(colchon.R[i] * agache[i] + directo.R[i] + rev.R[i] * 0.9 + ecos.R[i] * 0.5) * 0.9) * g;
}

// ─────────────────────────────────────────────────────────── archivo

function wav24(L: Float32Array, R: Float32Array) {
  const datos = Buffer.alloc(N * 6);
  for (let i = 0; i < N; i++) {
    for (const [c, x] of [L[i], R[i]].entries()) {
      const v = Math.max(-1, Math.min(1, x)) * 8388607;
      datos.writeIntLE(Math.round(v), i * 6 + c * 3, 3);
    }
  }
  const cabecera = Buffer.alloc(44);
  cabecera.write("RIFF", 0);
  cabecera.writeUInt32LE(36 + datos.length, 4);
  cabecera.write("WAVEfmt ", 8);
  cabecera.writeUInt32LE(16, 16);
  cabecera.writeUInt16LE(1, 20);
  cabecera.writeUInt16LE(2, 22);
  cabecera.writeUInt32LE(SR, 24);
  cabecera.writeUInt32LE(SR * 6, 28);
  cabecera.writeUInt16LE(6, 32);
  cabecera.writeUInt16LE(24, 34);
  cabecera.write("data", 36);
  cabecera.writeUInt32LE(datos.length, 40);
  return Buffer.concat([cabecera, datos]);
}

const carpeta = path.resolve(process.cwd(), "out", "promo100");
mkdirSync(carpeta, { recursive: true });
const crudo = path.join(carpeta, "musica-promo100-mezcla.wav");
writeFileSync(crudo, wav24(mezcla.L, mezcla.R));

// Loudnorm en dos pasadas: −14 LUFS integrados y −1 dBTP.
const ff = ffmpeg as unknown as string;
const medicion = spawnSync(ff, ["-hide_banner", "-i", crudo, "-af", "loudnorm=I=-14:TP=-1:LRA=9:print_format=json", "-f", "null", "-"], { encoding: "utf8" });
const informe = medicion.stderr;
const m = JSON.parse(informe.slice(informe.lastIndexOf("{"), informe.lastIndexOf("}") + 1));
const final = path.join(carpeta, "musica-promo100.wav");
execFileSync(ff, [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-i",
  crudo,
  "-af",
  `loudnorm=I=-14:TP=-1:LRA=9:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000,atrim=0:${DURACION}`,
  "-c:a",
  "pcm_s24le",
  final,
]);
console.log(`Música: ${final} · ${BPM.toFixed(2)} BPM (medida antes: ${m.input_i} LUFS, pico ${m.input_tp} dBTP)`);

// Energía por segundo de la mezcla cruda (para ver la forma sin escucharla).
const filas: string[] = [];
for (let s = 0; s < DURACION; s++) {
  let suma = 0;
  for (let i = s * SR; i < (s + 1) * SR; i++) suma += mezcla.L[i] ** 2 + mezcla.R[i] ** 2;
  filas.push(`${String(s).padStart(2)} s ${"#".repeat(Math.max(0, Math.round(60 + 10 * Math.log10(suma / (2 * SR) + 1e-12))))}`);
}
console.log(filas.join("\n"));
