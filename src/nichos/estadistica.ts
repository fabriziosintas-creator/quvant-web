import { metrosEntre } from "../servidor/panel/linkGoogle";

/**
 * La estadística de "Dentro del nicho", en TS puro (sin base ni red) y con
 * pruebas en estadistica.test.ts. Nada de esto inventa: con pocos datos,
 * devuelve null o lo marca, y la pantalla lo dice.
 */

// ── Proporciones ──────────────────────────────────────────────────────

/** Por debajo de esto, una tasa se muestra con el aviso de "muestra chica". */
export const MUESTRA_MINIMA = 20;

export type Proporcion = { p: number; bajo: number; alto: number; n: number; chica: boolean };

/** Intervalo de Wilson al 95 %: mejor que el "normal" con pocos casos o tasas cerca de 0 o de 1. */
export function wilson(exitos: number, n: number, z = 1.96): Proporcion | null {
  if (n <= 0) return null;
  const p = Math.min(1, Math.max(0, exitos / n));
  const z2 = z * z;
  const centro = (p + z2 / (2 * n)) / (1 + z2 / n);
  const margen = (z / (1 + z2 / n)) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return { p, bajo: Math.max(0, centro - margen), alto: Math.min(1, centro + margen), n, chica: n < MUESTRA_MINIMA };
}

/** Función de distribución normal estándar (aproximación de Abramowitz y Stegun, error < 1e-7). */
export function normalAcumulada(x: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2);
  const cola = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - cola : cola;
}

export type Comparacion = { diferencia: number; z: number; pValor: number; significativa: boolean; veredicto: "mejoro" | "empeoro" | "sin_cambio" | "sin_datos" };

/**
 * ¿Cambió de verdad una tasa entre dos períodos? Prueba de dos proporciones
 * (z, dos colas, 5 %). Solo dice "mejoró" o "empeoró" si es significativa.
 */
export function dosProporciones(x1: number, n1: number, x2: number, n2: number, alfa = 0.05): Comparacion {
  if (n1 <= 0 || n2 <= 0) return { diferencia: 0, z: 0, pValor: 1, significativa: false, veredicto: "sin_datos" };
  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const conjunta = (x1 + x2) / (n1 + n2);
  const error = Math.sqrt(conjunta * (1 - conjunta) * (1 / n1 + 1 / n2));
  if (error === 0) return { diferencia: p2 - p1, z: 0, pValor: 1, significativa: false, veredicto: "sin_cambio" };
  const z = (p2 - p1) / error;
  const pValor = 2 * (1 - normalAcumulada(Math.abs(z)));
  const significativa = pValor < alfa;
  return { diferencia: p2 - p1, z, pValor, significativa, veredicto: !significativa ? "sin_cambio" : p2 > p1 ? "mejoro" : "empeoro" };
}

// ── Series ────────────────────────────────────────────────────────────

export const media = (v: number[]) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : NaN);
export function desvio(v: number[]) {
  if (v.length < 2) return NaN;
  const m = media(v);
  return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1));
}

/** Percentil (0 a 1) con interpolación lineal. null si no hay valores. */
export function percentil(valores: number[], p: number): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const pos = (ordenados.length - 1) * Math.min(1, Math.max(0, p));
  const bajo = Math.floor(pos);
  const alto = Math.ceil(pos);
  return ordenados[bajo] + (ordenados[alto] - ordenados[bajo]) * (pos - bajo);
}

/** Qué tan lejos de lo normal está un valor respecto de su propia historia. null si la historia es corta o plana. */
export function puntajeZ(valor: number, historia: number[]): number | null {
  if (historia.length < 4) return null;
  const s = desvio(historia);
  if (!Number.isFinite(s) || s === 0) return null;
  return (valor - media(historia)) / s;
}

/** Las semanas fuera de lo normal: el último valor contra las anteriores (|z| ≥ umbral). */
export function anomalia(serie: number[], umbral = 2.5): { z: number; tipo: "alza" | "baja" } | null {
  if (serie.length < 5) return null;
  const z = puntajeZ(serie[serie.length - 1], serie.slice(0, -1));
  if (z === null || Math.abs(z) < umbral) return null;
  return { z, tipo: z > 0 ? "alza" : "baja" };
}

export type Pronostico = { valores: number[]; bajo: number[]; alto: number[] };

/**
 * Holt lineal (nivel + tendencia) para proyectar el MRR. Con menos de 4
 * puntos no proyecta. La banda crece con el horizonte (±1,96 × desvío de
 * los errores × √h) y nunca baja de cero.
 */
export function holtLineal(serie: number[], pasos: number, alfa = 0.5, beta = 0.3): Pronostico | null {
  if (serie.length < 4 || pasos < 1) return null;
  let nivel = serie[0];
  let tendencia = serie[1] - serie[0];
  const errores: number[] = [];
  for (let i = 1; i < serie.length; i++) {
    const previsto = nivel + tendencia;
    errores.push(serie[i] - previsto);
    const nivelAnterior = nivel;
    nivel = alfa * serie[i] + (1 - alfa) * (nivel + tendencia);
    tendencia = beta * (nivel - nivelAnterior) + (1 - beta) * tendencia;
  }
  const s = desvio(errores);
  const sigma = Number.isFinite(s) ? s : 0;
  const valores: number[] = [];
  const bajo: number[] = [];
  const alto: number[] = [];
  for (let h = 1; h <= pasos; h++) {
    const v = Math.max(0, nivel + h * tendencia);
    const margen = 1.96 * sigma * Math.sqrt(h);
    valores.push(v);
    bajo.push(Math.max(0, v - margen));
    alto.push(v + margen);
  }
  return { valores, bajo, alto };
}

// ── Cohortes ──────────────────────────────────────────────────────────

export type Cohorte = { mes: string; tamano: number; retencion: Array<number | null> };

const sumarMeses = (mes: string, n: number) => {
  const [a, m] = mes.split("-").map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
};

/**
 * Retención por mes de entrada: de los que entraron cada mes, qué parte
 * seguía activa N meses después. null si ese mes todavía no llegó.
 */
export function cohortes(socios: Array<{ alta: string; baja: string | null }>, hoy: string, desfases = [1, 2, 3, 6]): Cohorte[] {
  const porMes = new Map<string, Array<{ alta: string; baja: string | null }>>();
  for (const s of socios) porMes.set(s.alta.slice(0, 7), [...(porMes.get(s.alta.slice(0, 7)) ?? []), s]);
  const mesHoy = hoy.slice(0, 7);
  return [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, grupo]) => ({
      mes,
      tamano: grupo.length,
      retencion: desfases.map((d) => {
        const objetivo = sumarMeses(mes, d);
        if (objetivo > mesHoy) return null;
        // "Activo en el mes objetivo": sin baja, o con baja después de que empezó ese mes.
        const corte = `${objetivo}-01`;
        return grupo.filter((s) => s.baja === null || s.baja >= corte).length / grupo.length;
      }),
    }));
}

// ── Recorrido del día ─────────────────────────────────────────────────

export type Punto = { id: string; latitud: number; longitud: number };

/** Hasta `maximo` paradas por vecino más cercano desde el origen (sin APIs pagas). */
export function recorridoCercano<T extends Punto>(origen: { latitud: number; longitud: number }, puntos: T[], maximo = 8): T[] {
  const quedan = [...puntos];
  const ruta: T[] = [];
  let actual = origen;
  while (quedan.length > 0 && ruta.length < maximo) {
    let mejor = 0;
    let distancia = Infinity;
    quedan.forEach((p, i) => {
      const d = metrosEntre(actual, p);
      if (d < distancia) {
        distancia = d;
        mejor = i;
      }
    });
    const [siguiente] = quedan.splice(mejor, 1);
    ruta.push(siguiente);
    actual = siguiente;
  }
  return ruta;
}

/** El link de Google Maps con paradas (solo un link, sin API): origen, paradas intermedias y destino. */
export function linkRecorrido(paradas: Punto[]): string | null {
  if (paradas.length === 0) return null;
  const c = (p: Punto) => `${p.latitud},${p.longitud}`;
  const destino = paradas[paradas.length - 1];
  const intermedias = paradas.slice(0, -1).map(c).join("|");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c(destino))}${intermedias ? `&waypoints=${encodeURIComponent(intermedias)}` : ""}&travelmode=driving`;
}

// ── Qué función acompaña a los que se quedan ──────────────────────────

export type FuncionYPermanencia = { funcion: string; conLaFuncion: Proporcion | null; sinLaFuncion: Proporcion | null; diferencia: number | null };

/**
 * Para cada función clave: qué parte de los que la usan sigue activa,
 * contra los que no la usan. Es una correlación, nunca una causa (la
 * pantalla lo dice).
 */
export function funcionesQueRetienen(socios: Array<{ activo: boolean; usadas: string[] }>, funciones: string[]): FuncionYPermanencia[] {
  return funciones
    .map((funcion) => {
      const con = socios.filter((s) => s.usadas.includes(funcion));
      const sin = socios.filter((s) => !s.usadas.includes(funcion));
      const conLaFuncion = wilson(con.filter((s) => s.activo).length, con.length);
      const sinLaFuncion = wilson(sin.filter((s) => s.activo).length, sin.length);
      return { funcion, conLaFuncion, sinLaFuncion, diferencia: conLaFuncion && sinLaFuncion ? conLaFuncion.p - sinLaFuncion.p : null };
    })
    .sort((a, b) => (b.diferencia ?? -2) - (a.diferencia ?? -2));
}
