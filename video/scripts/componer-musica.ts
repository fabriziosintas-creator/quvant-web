/**
 * npm run musica
 *
 * Compone la música del spot-completo en código: electrónica mínima y
 * oscura, sin drops, a 120 BPM en re menor, cortada a medida de la línea
 * de tiempo del spot (cada sección empieza donde empieza su escena). Es
 * una pieza original de Quvant: no hay licencias que cuidar.
 *
 * Salidas (assets/audio/, se regeneran):
 *  - musica-quvant.wav: la música, 48 kHz estéreo, 45 s.
 *  - tic.wav: el "tic" corto y seco que suena en cada salto (la mezcla lo
 *    pone en los aterrizajes: npm run mezclar-spot).
 *
 * Si se prefiere un tema de Pixabay Music, alcanza con dejarlo como
 * assets/audio/musica.mp3 (o .wav): la mezcla lo usa en lugar de este.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SR = 48000;
const DURACION = 45;
const N = SR * DURACION;
const BPM = 120;
const PULSO = 60 / BPM;

// ---------------------------------------------------------------- utilidades

/** Generador pseudoaleatorio determinístico (mulberry32): la pista sale igual siempre. */
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
const ruido = azar(20261014);
const blanco = () => ruido() * 2 - 1;

const nota = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const NOTAS: Record<string, number> = { C: 0, "C#": 1, D: 2, Eb: 3, E: 4, F: 5, "F#": 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
/** "D3" → número MIDI. */
const midi = (s: string) => {
  const m = /^([A-G][b#]?)(-?\d)$/.exec(s);
  if (!m) throw new Error(`nota inválida ${s}`);
  return NOTAS[m[1]] + (Number(m[2]) + 1) * 12;
};

/** Biquad de la receta de RBJ, con el corte que se puede mover muestra a muestra. */
class Filtro {
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
    this.corte(corte);
  }
  corte(f: number) {
    const w = (2 * Math.PI * Math.min(Math.max(f, 20), SR * 0.45)) / SR;
    const alfa = Math.sin(w) / (2 * this.q);
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

/** Diente de sierra con corrección polyBLEP (sin el aliasing del ingenuo). */
function sierra(fase: number, dt: number) {
  let v = 2 * fase - 1;
  if (fase < dt) {
    const t = fase / dt;
    v -= t + t - t * t - 1;
  } else if (fase > 1 - dt) {
    const t = (fase - 1) / dt;
    v -= t * t + t + t + 1;
  }
  return v;
}

// ---------------------------------------------------------------- buses

const seco = [new Float32Array(N), new Float32Array(N)];
const reverbEnvio = new Float32Array(N);
const ecoEnvio = new Float32Array(N);
/** Cuánto baja el pad y el bajo cuando pega el bombo (el "bombeo" del sidechain). */
const bombeo = new Float32Array(N).fill(1);

function sumar(i: number, izq: number, der: number, reverb = 0, eco = 0) {
  if (i < 0 || i >= N) return;
  seco[0][i] += izq;
  seco[1][i] += der;
  reverbEnvio[i] += ((izq + der) / 2) * reverb;
  ecoEnvio[i] += ((izq + der) / 2) * eco;
}

const muestra = (t: number) => Math.round(t * SR);

// ---------------------------------------------------------------- instrumentos

function bombo(t0: number, g = 1) {
  const i0 = muestra(t0);
  let fase = 0;
  for (let k = 0; k < SR * 0.6; k++) {
    const t = k / SR;
    const f = 48 + 78 * Math.exp(-t / 0.028);
    fase += f / SR;
    const cuerpo = Math.sin(2 * Math.PI * fase) * Math.exp(-t / 0.22);
    const golpe = k < SR * 0.004 ? blanco() * (1 - k / (SR * 0.004)) * 0.25 : 0;
    const v = Math.tanh((cuerpo + golpe) * 1.6) * 0.62 * g;
    sumar(i0 + k, v, v, 0.02);
  }
  // El resto se aparta: el pad y el bajo bajan y vuelven en 0,22 s.
  for (let k = 0; k < SR * 0.3; k++) {
    const i = i0 + k;
    if (i >= N) break;
    const r = 1 - 0.55 * Math.exp(-k / (SR * 0.07));
    bombeo[i] = Math.min(bombeo[i], r);
  }
}

function palmas(t0: number, g = 1) {
  const i0 = muestra(t0);
  const filtro = new Filtro("bp", 1400, 0.9);
  for (let k = 0; k < SR * 0.35; k++) {
    const t = k / SR;
    // Tres golpecitos muy juntos y la cola.
    const env =
      t < 0.024 ? Math.exp(-((t % 0.008) / 0.0025)) : Math.exp(-(t - 0.024) / 0.09);
    const v = filtro.paso(blanco()) * env * 0.5 * g;
    sumar(i0 + k, v * 0.9, v, 0.35);
  }
}

function platillo(t0: number, g = 1, abierto = false) {
  const i0 = muestra(t0);
  const filtro = new Filtro("hp", 7500, 0.7);
  const largo = abierto ? 0.22 : 0.045;
  const paneo = 0.5 + (ruido() - 0.5) * 0.4;
  for (let k = 0; k < SR * largo * 4; k++) {
    const v = filtro.paso(blanco()) * Math.exp(-k / (SR * largo)) * 0.16 * g;
    sumar(i0 + k, v * (1 - paneo) * 2 * 0.5, v * paneo * 2 * 0.5, 0.05);
  }
}

function bajo(m: number, t0: number, dur: number, g = 1) {
  const i0 = muestra(t0);
  const f = nota(m);
  const filtro = new Filtro("lp", 300, 1.1);
  let fs = 0;
  let fb = 0;
  for (let k = 0; k < SR * (dur + 0.05); k++) {
    const t = k / SR;
    if (k % 16 === 0) filtro.corte(180 + 900 * Math.exp(-t / 0.07));
    fs += f / SR;
    fs -= Math.floor(fs);
    fb += f / SR;
    fb -= Math.floor(fb);
    const env = Math.min(1, t / 0.004) * (t < dur ? 1 : Math.exp(-(t - dur) / 0.012)) * Math.exp(-t / 0.4);
    const v = (filtro.paso(sierra(fs, f / SR)) * 0.5 + Math.sin(2 * Math.PI * fb) * 0.55) * env * 0.42 * g;
    const i = i0 + k;
    if (i < N) sumar(i, v * bombeo[i], v * bombeo[i]);
  }
}

function pad(acorde: string[], t0: number, t1: number, g = 1, ataque = 1.2, suelta = 1.4) {
  const i0 = muestra(t0);
  const voces = acorde.flatMap((s, j) => [-7, 7].map((c) => ({ f: nota(midi(s)) * 2 ** (c / 1200), lado: c < 0 ? 0 : 1, fase: (j * 0.37 + (c > 0 ? 0.5 : 0)) % 1 })));
  const filtros = [new Filtro("lp", 900, 0.6), new Filtro("lp", 900, 0.6)];
  const total = t1 - t0 + suelta;
  for (let k = 0; k < SR * total; k++) {
    const t = k / SR;
    const i = i0 + k;
    if (i >= N) break;
    if (k % 32 === 0) {
      const corte = 700 + 450 * Math.sin(2 * Math.PI * 0.11 * (t0 + t));
      filtros[0].corte(corte);
      filtros[1].corte(corte * 1.06);
    }
    let l = 0;
    let r = 0;
    for (const voz of voces) {
      voz.fase += voz.f / SR;
      voz.fase -= Math.floor(voz.fase);
      const s = sierra(voz.fase, voz.f / SR);
      if (voz.lado === 0) l += s;
      else r += s;
    }
    const env = Math.min(1, t / ataque) * (t < t1 - t0 ? 1 : Math.exp(-(t - (t1 - t0)) / (suelta / 4)));
    const a = (env * 0.07 * g) / Math.sqrt(acorde.length);
    const b = 0.6 + 0.4 * bombeo[i];
    sumar(i, filtros[0].paso(l) * a * b, filtros[1].paso(r) * a * b, 0.5);
  }
}

function pulsado(m: number, t0: number, g = 1, decae = 0.22) {
  const i0 = muestra(t0);
  const f = nota(m);
  const filtro = new Filtro("lp", 2000, 1.4);
  let fase = 0;
  let fase2 = 0.25;
  for (let k = 0; k < SR * decae * 5; k++) {
    const t = k / SR;
    if (k % 16 === 0) filtro.corte(350 + 3200 * Math.exp(-t / 0.05));
    fase += f / SR;
    fase -= Math.floor(fase);
    fase2 += (f * 1.003) / SR;
    fase2 -= Math.floor(fase2);
    const v = filtro.paso(sierra(fase, f / SR) * 0.5 + sierra(fase2, f / SR) * 0.5) * Math.exp(-t / decae) * Math.min(1, t / 0.002) * 0.17 * g;
    sumar(i0 + k, v, v, 0.25, 0.45);
  }
}

function campanita(m: number, t0: number, g = 1) {
  const i0 = muestra(t0);
  const f = nota(m);
  for (let k = 0; k < SR * 2.5; k++) {
    const t = k / SR;
    const indice = 1.2 * Math.exp(-t / 0.4);
    const v = Math.sin(2 * Math.PI * f * t + indice * Math.sin(2 * Math.PI * f * 3.5 * t)) * Math.exp(-t / 0.6) * Math.min(1, t / 0.003) * 0.09 * g;
    sumar(i0 + k, v, v, 0.6, 0.2);
  }
}

function subida(t0: number, t1: number, g = 1) {
  const i0 = muestra(t0);
  const filtro = new Filtro("bp", 300, 2.5);
  const total = t1 - t0;
  for (let k = 0; k < SR * total; k++) {
    const p = k / (SR * total);
    if (k % 16 === 0) filtro.corte(300 * 20 ** p);
    const v = filtro.paso(blanco()) * p ** 2.2 * 0.5 * g;
    sumar(i0 + k, v * (0.8 + 0.2 * Math.sin(p * 40)), v * (0.8 - 0.2 * Math.sin(p * 40)), 0.3);
  }
}

function golpeGrave(t0: number, g = 1) {
  const i0 = muestra(t0);
  let fase = 0;
  for (let k = 0; k < SR * 3.2; k++) {
    const t = k / SR;
    fase += (46 + 34 * Math.exp(-t / 0.08)) / SR;
    const v = Math.tanh(Math.sin(2 * Math.PI * fase) * Math.exp(-t / 0.9) * 1.4) * 0.6 * g;
    sumar(i0 + k, v, v, 0.25);
  }
}

function zumbido(m: number, t0: number, t1: number, g = 1) {
  const i0 = muestra(t0);
  const f = nota(m);
  for (let k = 0; k < SR * (t1 - t0); k++) {
    const t = k / SR;
    const env = Math.min(1, t / 1.5) * Math.min(1, (t1 - t0 - t) / 0.4);
    const v = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 1.5 * t)) * env * 0.16 * g;
    sumar(i0 + k, v, v, 0.3);
  }
}

// ---------------------------------------------------------------- efectos

/** Reverb de Schroeder (cuatro peines y dos pasatodo por canal), con los tiempos corridos en cada lado. */
function reverb(entrada: Float32Array) {
  const salida = [new Float32Array(N), new Float32Array(N)];
  const peines = [
    [1557, 1617, 1491, 1422],
    [1577, 1641, 1513, 1446],
  ];
  const pasatodo = [
    [225, 556],
    [241, 579],
  ];
  for (let c = 0; c < 2; c++) {
    const largos = peines[c].map((n) => Math.round((n * SR) / 44100 * 1.6));
    const memorias = largos.map((n) => new Float32Array(n));
    const posiciones = largos.map(() => 0);
    const amortiguado = largos.map(() => 0);
    const a = pasatodo[c].map((n) => Math.round((n * SR) / 44100));
    const memA = a.map((n) => new Float32Array(n));
    const posA = a.map(() => 0);
    for (let i = 0; i < N; i++) {
      const x = entrada[i] * 0.3;
      let y = 0;
      for (let j = 0; j < largos.length; j++) {
        const m = memorias[j];
        const leido = m[posiciones[j]];
        amortiguado[j] = leido * 0.6 + amortiguado[j] * 0.4;
        m[posiciones[j]] = x + amortiguado[j] * 0.86;
        posiciones[j] = (posiciones[j] + 1) % m.length;
        y += leido;
      }
      for (let j = 0; j < a.length; j++) {
        const m = memA[j];
        const leido = m[posA[j]];
        const v = -y * 0.5 + leido;
        m[posA[j]] = y + leido * 0.5;
        posA[j] = (posA[j] + 1) % m.length;
        y = v;
      }
      salida[c][i] = y;
    }
  }
  return salida;
}

/** Eco de ida y vuelta a 3/16. */
function eco(entrada: Float32Array) {
  const salida = [new Float32Array(N), new Float32Array(N)];
  const d = Math.round(PULSO * 0.75 * SR);
  for (let i = 0; i < N; i++) {
    const l = i >= d ? salida[1][i - d] * 0.42 + entrada[i - d] : 0;
    const r = i >= d ? salida[0][i - d] * 0.42 : 0;
    salida[0][i] = l;
    salida[1][i] = r;
  }
  const lp = [new Filtro("lp", 3500), new Filtro("lp", 3500)];
  for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) salida[c][i] = lp[c].paso(salida[c][i]) * 0.5;
  return salida;
}

// ---------------------------------------------------------------- la partitura

/** La armonía, por tramos: [desde, hasta, acorde]. Las secciones caen donde caen las escenas del spot. */
const ARMONIA: [number, number, string[]][] = [
  [3, 7, ["D3", "F3", "A3", "E4"]], // Dm9
  [7, 11, ["Bb2", "D3", "F3", "A3"]], // Bbmaj7
  [11, 14, ["G2", "Bb2", "D3", "A3"]], // Gm9
  [14, 18, ["D3", "F3", "A3", "E4"]],
  [18, 22, ["Bb2", "D3", "F3", "A3"]],
  [22, 24, ["G2", "Bb2", "D3", "A3"]],
  [24, 28, ["D3", "F3", "A3", "E4"]],
  [28, 32, ["Bb2", "D3", "F3", "A3"]],
  [32, 33, ["A2", "D3", "E3", "G3"]], // A7sus4
  [33, 36, ["G2", "Bb2", "D3", "A3"]],
  [36, 40, ["A2", "D3", "E3", "G3"]],
];
const RAIZ: Record<string, string> = { D3: "D2", Bb2: "Bb1", G2: "G1", A2: "A1" };

const acordeEn = (t: number) => ARMONIA.find(([a, b]) => t >= a && t < b)?.[2];

/** Pulsos (en segundos) entre desde y hasta, con un desfase dentro del pulso. */
function pulsos(desde: number, hasta: number, cada = PULSO, desfase = 0) {
  const lista: number[] = [];
  for (let t = Math.ceil((desde - desfase) / cada - 1e-9) * cada + desfase; t < hasta - 1e-9; t += cada) lista.push(t);
  return lista;
}

// Los tramos con bombo (los saltos tienen su aire: sin bombo justo antes).
const CON_BOMBO: [number, number, number][] = [
  [3, 12, 0.75],
  [14, 22.3, 1],
  [24, 32.4, 1],
  [36, 39.3, 0.9],
];

function componer() {
  // Apertura: un zumbido grave que aparece con la grilla y tres "pings" con el parpadeo del punto.
  zumbido(midi("D2"), 0.2, 3.4, 0.45);
  zumbido(midi("A2"), 0.8, 3.4, 0.25);
  for (const t of [1.0, 1.42, 1.84]) campanita(midi("D6"), t, 0.55);

  // Primero los bombos: dejan marcado el "bombeo" que después usan el pad y el bajo.
  for (const [desde, hasta, g] of CON_BOMBO) for (const t of pulsos(desde, hasta)) bombo(t, g);

  for (const [a, b, acorde] of ARMONIA) pad(acorde, a, b, a >= 33 && a < 36 ? 1.2 : 1);

  for (const [desde, hasta, g] of CON_BOMBO) {
    // Bajo a contratiempo, sobre la raíz del acorde.
    for (const t of pulsos(desde, hasta, PULSO, PULSO / 2)) {
      const acorde = acordeEn(t);
      if (acorde) bajo(midi(RAIZ[acorde[0]]), t, PULSO * 0.42, g);
    }
    // Platillos: corcheas a contratiempo; semicorcheas en Yunque y Forja.
    const cada = desde >= 14 && desde < 33 ? PULSO / 4 : PULSO / 2;
    for (const t of pulsos(desde, hasta, cada, cada === PULSO / 2 ? PULSO / 2 : 0)) {
      const enPulso = Math.abs(t / PULSO - Math.round(t / PULSO)) < 1e-6;
      if (!enPulso || cada === PULSO / 2) platillo(t, (enPulso ? 0.5 : 1) * g * (desde < 14 ? 0.7 : 1));
    }
    if (desde >= 14 && desde < 33) for (const t of pulsos(desde, hasta, PULSO * 2, PULSO)) palmas(t, 0.8);
  }
  // Un platillo abierto al entrar en cada producto.
  for (const t of [14, 24]) platillo(t, 1.2, true);

  // Arpegio en semicorcheas desde el diseño hasta el final de Forja (y de nuevo en el método).
  const patron = [0, 2, 1, 3, 2, 1, 3, 0];
  const arpegio = (desde: number, hasta: number, g: number) =>
    pulsos(desde, hasta, PULSO / 4).forEach((t, j) => {
      const acorde = acordeEn(t);
      if (!acorde) return;
      const m = midi(acorde[patron[j % patron.length] % acorde.length]) + 12;
      pulsado(m, t, (j % 4 === 0 ? 1 : 0.65) * g);
    });
  arpegio(8, 12, 0.8);
  arpegio(14, 22.3, 0.9);
  arpegio(24, 32.4, 1);
  arpegio(37.5, 39.3, 0.8);

  // Las tres fases: tres notas que suben, con los tres puntos cuadrados.
  [36.7, 36.95, 37.2].forEach((t, j) => pulsado(midi(["D5", "F5", "A5"][j]), t, 1.6, 0.35));

  // El aire antes de cada salto.
  subida(12.2, 13.47, 0.8);
  subida(22.5, 23.47, 0.9);
  subida(31.9, 32.47, 0.6);
  subida(34.9, 35.47, 0.6);
  subida(38.5, 39.47, 1);

  // Cierre: el golpe grave, el acorde que resuelve y una campanita cuando aparece QUVANT.
  golpeGrave(40.0, 1);
  pad(["D3", "F3", "A3", "E4", "A4"], 40.0, 44.0, 1.3, 0.25, 2);
  zumbido(midi("D2"), 40.0, 45, 0.4);
  campanita(midi("A5"), 41.85, 0.8);
  campanita(midi("D6"), 41.95, 0.5);
}

// ---------------------------------------------------------------- mezcla y archivos

function escribirWav(archivo: string, canales: Float32Array[]) {
  const n = canales[0].length;
  const datos = Buffer.alloc(44 + n * 4);
  datos.write("RIFF", 0);
  datos.writeUInt32LE(36 + n * 4, 4);
  datos.write("WAVE", 8);
  datos.write("fmt ", 12);
  datos.writeUInt32LE(16, 16);
  datos.writeUInt16LE(1, 20);
  datos.writeUInt16LE(2, 22);
  datos.writeUInt32LE(SR, 24);
  datos.writeUInt32LE(SR * 4, 28);
  datos.writeUInt16LE(4, 32);
  datos.writeUInt16LE(16, 34);
  datos.write("data", 36);
  datos.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 2; c++) {
      const v = Math.max(-1, Math.min(1, canales[c][i]));
      datos.writeInt16LE(Math.round(v * 32767), 44 + i * 4 + c * 2);
    }
  }
  writeFileSync(archivo, datos);
}

/** El tic del salto: un clic muy corto y seco (sin reverb), 60 ms. */
function tic() {
  const n = Math.round(SR * 0.06);
  const l = new Float32Array(n);
  const filtro = new Filtro("hp", 1800, 0.8);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const tono = Math.sin(2 * Math.PI * 3100 * t) * Math.exp(-t / 0.006);
    const golpe = k < SR * 0.0015 ? blanco() : 0;
    l[k] = filtro.paso(tono * 0.7 + golpe * 0.5) * 0.8;
  }
  return [l, l.slice()];
}

function main() {
  componer();
  const verb = reverb(reverbEnvio);
  const ecos = eco(ecoEnvio);
  const salida = [new Float32Array(N), new Float32Array(N)];
  // Debajo de 35 Hz no hay nada que se escuche en un parlante común: solo come margen.
  const graves = [new Filtro("hp", 35), new Filtro("hp", 35)];
  let pico = 0;
  for (let c = 0; c < 2; c++) {
    for (let i = 0; i < N; i++) {
      const t = i / SR;
      // Entra desde el silencio y se apaga con la firma, al final del cuadro.
      const fundido = Math.min(1, t / 0.4) * (t > 43.4 ? Math.max(0, 1 - (t - 43.4) / 1.6) ** 1.5 : 1);
      const v = graves[c].paso(seco[c][i] + verb[c][i] * 0.9 + ecos[c][i] * 0.6) * fundido;
      salida[c][i] = Math.tanh(v * 1.1) * 0.95;
      pico = Math.max(pico, Math.abs(salida[c][i]));
    }
  }
  const ganancia = 0.89 / pico; // pico a −1 dBFS; la sonoridad la ajusta la mezcla final (loudnorm)
  for (const c of salida) for (let i = 0; i < N; i++) c[i] *= ganancia;

  const carpeta = path.join(process.cwd(), "assets", "audio");
  mkdirSync(carpeta, { recursive: true });
  escribirWav(path.join(carpeta, "musica-quvant.wav"), salida);
  escribirWav(path.join(carpeta, "tic.wav"), tic());
  console.log("musica-quvant.wav y tic.wav en", carpeta);
}

main();
