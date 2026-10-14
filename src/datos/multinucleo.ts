/**
 * Núcleos Quvant · Multi núcleo: el ejemplo que cuenta la escena 3D de
 * "Sistemas listos para tu nicho".
 *
 * Cada empresa tiene su propio núcleo: su sistema y su administración,
 * independientes. El Multi núcleo las conecta en un solo panel para seguir
 * sus estadísticas y entrar a cada una por separado.
 *
 * Son EMPRESAS DE EJEMPLO (una por rubro, "tu ferretería", "tu gimnasio"…)
 * con DATOS DE EJEMPLO: nunca clientes reales ni cifras de Quvant. La
 * ventana y el panel lo dicen.
 */

import { ACENTO_NICHO } from "./colores";

export type IdEmpresa = "ferreteria" | "gimnasio" | "farmacia" | "estudio";

export type Modulo = {
  nombre: string;
  valor: string;
  /** Qué tan lleno se ve su barra, de 0 a 1 (solo forma, sin unidades). */
  nivel: number;
};

export type Empresa = {
  id: IdEmpresa;
  /** Cómo se nombra en el panel. */
  nombre: string;
  /** Cómo se rotula en la escena 3D (Michroma, mayúsculas). */
  rotulo: string;
  color: string;
  /** Ventas de los últimos 12 días, de 0 a 1: la forma de la curva, sin unidades. */
  serie: readonly number[];
  variacion: string;
  estado: { texto: string; alerta: boolean };
  /** Su administración propia: lo que ve quien entra a esa empresa. */
  modulos: readonly Modulo[];
};

export const EMPRESAS: readonly Empresa[] = [
  {
    id: "ferreteria",
    nombre: "Tu ferretería",
    rotulo: "FERRETERÍA",
    color: ACENTO_NICHO.industria,
    serie: [0.42, 0.48, 0.45, 0.55, 0.52, 0.6, 0.58, 0.66, 0.63, 0.7, 0.74, 0.78],
    variacion: "+8 % esta semana",
    estado: { texto: "Revisar stock", alerta: true },
    modulos: [
      { nombre: "Ventas", valor: "+8 % esta semana", nivel: 0.74 },
      { nombre: "Stock", valor: "3 productos bajo el mínimo", nivel: 0.38 },
      { nombre: "Caja", valor: "2 cajas abiertas", nivel: 0.8 },
      { nombre: "Equipo", valor: "5 personas en turno", nivel: 0.6 },
    ],
  },
  {
    id: "gimnasio",
    nombre: "Tu gimnasio",
    rotulo: "GIMNASIO",
    color: ACENTO_NICHO.gimnasios,
    serie: [0.55, 0.5, 0.58, 0.62, 0.57, 0.64, 0.7, 0.66, 0.72, 0.69, 0.75, 0.73],
    variacion: "+5 % este mes",
    estado: { texto: "Al día", alerta: false },
    modulos: [
      { nombre: "Socios", valor: "18 altas este mes", nivel: 0.66 },
      { nombre: "Cuotas", valor: "92 % al día", nivel: 0.92 },
      { nombre: "Clases", valor: "6 clases hoy", nivel: 0.55 },
      { nombre: "Caja", valor: "Abierta", nivel: 0.7 },
    ],
  },
  {
    id: "farmacia",
    nombre: "Tu farmacia",
    rotulo: "FARMACIA",
    color: ACENTO_NICHO.farmacias,
    serie: [0.6, 0.64, 0.61, 0.58, 0.66, 0.7, 0.68, 0.73, 0.71, 0.77, 0.75, 0.8],
    variacion: "+6 % esta semana",
    estado: { texto: "Al día", alerta: false },
    modulos: [
      { nombre: "Ventas", valor: "+6 % esta semana", nivel: 0.7 },
      { nombre: "Recetas", valor: "27 recetas hoy", nivel: 0.62 },
      { nombre: "Vencimientos", valor: "4 lotes este mes", nivel: 0.3 },
      { nombre: "Caja", valor: "Abierta", nivel: 0.76 },
    ],
  },
  {
    id: "estudio",
    nombre: "Tu estudio jurídico",
    rotulo: "ESTUDIO",
    color: ACENTO_NICHO.abogacia,
    serie: [0.35, 0.38, 0.44, 0.4, 0.47, 0.45, 0.52, 0.5, 0.55, 0.53, 0.58, 0.62],
    variacion: "+3 % este mes",
    estado: { texto: "2 cobros pendientes", alerta: true },
    modulos: [
      { nombre: "Expedientes", valor: "41 activos", nivel: 0.68 },
      { nombre: "Agenda", valor: "3 audiencias esta semana", nivel: 0.45 },
      { nombre: "Honorarios", valor: "2 por cobrar", nivel: 0.35 },
      { nombre: "Equipo", valor: "4 abogados", nivel: 0.5 },
    ],
  },
];

/**
 * El recorrido que la escena hace sola, como un video: cuánto dura cada
 * capítulo, en segundos. El último pasa por cada empresa.
 */
export const SEGUNDOS_POR_EMPRESA = 2.4;
export const DURACION_CAPITULOS = [3.8, 3.6, 3.8, SEGUNDOS_POR_EMPRESA * EMPRESAS.length] as const;

export const INICIO_CAPITULOS = DURACION_CAPITULOS.reduce<number[]>((acc, d, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + DURACION_CAPITULOS[i - 1]);
  return acc;
}, []);

export const DURACION_RECORRIDO = DURACION_CAPITULOS.reduce((a, b) => a + b, 0);
