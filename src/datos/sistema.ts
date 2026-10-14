/**
 * Pantallas reales del sistema Quvant (empresa demo) y las "paradas" del
 * recorrido de la sección Plataformas: a qué parte de qué captura hay que
 * hacer zoom para mostrar cada función.
 *
 * Las capturas viven en public/sistema/ y salen de
 * marca/video/capturas-sistema/ (se recortó la fila cortada del borde).
 * Reglas: nunca una pantalla con el nombre viejo, ni con ARCA, Mercado
 * Pago o WhatsApp como funciones. Los números son los de la empresa demo.
 */

export type Captura = {
  src: string;
  ancho: number;
  alto: number;
  alt: string;
};

/** Zona de una captura, en fracciones de 0 a 1 del ancho y del alto. */
export type Zona = { x: number; y: number; w: number; h: number };

export type Parada = {
  /** Coincide con el id de PLATAFORMAS.hoy.destacadas, o "inicio". */
  id: string;
  captura: keyof typeof CAPTURAS;
  zona: Zona;
  /** "cubrir" llena la ventana (vista general); "encajar" mete la zona entera con aire. */
  modo: "cubrir" | "encajar";
};

export const CAPTURAS = {
  tablero: {
    src: "/sistema/tablero.webp",
    ancho: 1880,
    alto: 862,
    alt: "Tablero del dueño en Quvant: ventas de hoy por negocio y sucursal, ventas de los últimos 30 días, ventas del mes, ticket promedio, margen bruto y presupuestos abiertos. Datos de la empresa demo.",
  },
  tableroAbajo: {
    src: "/sistema/tablero-abajo.webp",
    ancho: 1560,
    alto: 605,
    alt: "Parte inferior del tablero: lista «Para atender hoy» con productos sin stock, bajo el mínimo, presupuestos por vencer y equipos listos; lo más vendido del mes; actividad reciente. Datos de la empresa demo.",
  },
} as const satisfies Record<string, Captura>;

export const PARADAS: readonly Parada[] = [
  { id: "inicio", captura: "tablero", zona: { x: 0, y: 0, w: 1, h: 1 }, modo: "cubrir" },
  // La tarjeta "Margen bruto · 30 días", abajo a la derecha del tablero.
  { id: "margen", captura: "tablero", zona: { x: 0.585, y: 0.795, w: 0.21, h: 0.2 }, modo: "encajar" },
  // El estado "Sincronizado" junto a la sucursal, arriba a la derecha.
  { id: "offline", captura: "tablero", zona: { x: 0.76, y: 0.01, w: 0.24, h: 0.078 }, modo: "encajar" },
  // El panel "Para atender hoy" completo, del tablero del dueño.
  { id: "tablero", captura: "tableroAbajo", zona: { x: 0.004, y: 0.02, w: 0.325, h: 0.96 }, modo: "encajar" },
  // "Sin stock · Productos agotados en alguna sucursal".
  { id: "stock", captura: "tableroAbajo", zona: { x: 0.004, y: 0.12, w: 0.325, h: 0.15 }, modo: "encajar" },
  // "Bajo el mínimo · Reponer pronto": lo que dispara las compras sugeridas.
  { id: "compras", captura: "tableroAbajo", zona: { x: 0.004, y: 0.245, w: 0.325, h: 0.14 }, modo: "encajar" },
];
