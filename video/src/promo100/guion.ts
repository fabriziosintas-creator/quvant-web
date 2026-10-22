/**
 * El guion del video de "Primeros 100" (video/promo-100/GUION.md): tres
 * capítulos de 13 segundos, uno por situación, y un cierre de 3. Lo usan
 * la composición (Promo100.tsx), los subtítulos (npm run promo100-vtt) y
 * los capítulos de la web (VIDEO_PROMO en src/datos/promo.ts: 0, 13 y 26).
 *
 * Cada capítulo: el problema dicho como lo diría el comerciante, la
 * pantalla real del sistema resolviéndolo, y una línea que lo cierra.
 * Todo lo que se promete está verificado en la demo
 * (docs/promo-primeros-100-verificacion.md).
 */

export const FPS = 30;
export const CAPITULO = 13;
export const CIERRE = 3;
export const DURACION = CAPITULO * 3 + CIERRE;

export type Plano = {
  /** La captura (public/promo100/, npm run preparar-promo100). */
  captura: string;
  /** Desde qué segundo del capítulo se ve. */
  desde: number;
  /** Acercamiento al final del plano (1 = la pantalla entera). */
  zoom: number;
  /** Hacia dónde se acerca, en fracciones de la captura (origen arriba a la izquierda). */
  foco: [number, number];
  /** Una marca sobre la zona que importa (fracciones: x, y, ancho, alto). */
  marca?: [number, number, number, number];
};

export type Capitulo = {
  id: "sin-internet" | "aumento" | "stock";
  /** El problema, en la boca del comerciante (0 a 2,5 s). */
  problema: string;
  /** Lo que se ve en la pantalla (2,5 a 10 s). */
  planos: Plano[];
  /** El subtítulo de cada momento de la pantalla. */
  subtitulos: Array<{ desde: number; hasta: number; texto: string }>;
  /** La línea que lo cierra (10 a 13 s). */
  cierre: string;
};

export const CAPITULOS: Capitulo[] = [
  {
    id: "sin-internet",
    problema: "Se cortó internet. ¿Y ahora?",
    planos: [
      // Las coordenadas son fracciones de la captura recortada (1360 × 1000, sin la barra lateral).
      { captura: "mostrador-sin-conexion.webp", desde: 2.5, zoom: 1.4, foco: [0.32, 0.17], marca: [0.005, 0.152, 0.99, 0.045] },
      { captura: "mostrador-reconectado.webp", desde: 6.5, zoom: 1.6, foco: [0.88, 0.03], marca: [0.835, 0.012, 0.105, 0.038] },
    ],
    subtitulos: [
      { desde: 2.5, hasta: 6.5, texto: "El mostrador sigue cobrando: las ventas quedan en cola." },
      { desde: 6.5, hasta: 10, texto: "Vuelve la conexión y se mandan solas." },
    ],
    cierre: "Sin internet, se sigue vendiendo.",
  },
  {
    id: "aumento",
    problema: "Llegó la lista nueva del proveedor.",
    planos: [
      { captura: "precios-aumento-redondeo.webp", desde: 2.5, zoom: 1.6, foco: [0.12, 0.6], marca: [0.02, 0.655, 0.235, 0.06] },
      { captura: "precios-aumento-redondeo.webp", desde: 6.5, zoom: 1.35, foco: [0.7, 0.4], marca: [0.27, 0.378, 0.73, 0.052] },
    ],
    subtitulos: [
      { desde: 2.5, hasta: 6.5, texto: "Subís los costos y elegís cómo redondear." },
      { desde: 6.5, hasta: 10, texto: "Ves los precios nuevos y tu margen antes de aplicar." },
    ],
    cierre: "Precios al día en minutos, sin calcular a mano.",
  },
  {
    id: "stock",
    problema: "Se está terminando algo.",
    planos: [
      { captura: "tablero-bajo-minimo.webp", desde: 2.5, zoom: 1.6, foco: [0.17, 0.85], marca: [0.025, 0.825, 0.29, 0.065] },
      { captura: "compras-ordenes-sugeridas.webp", desde: 6.5, zoom: 1.4, foco: [0.2, 0.17], marca: [0.008, 0.14, 0.36, 0.085] },
    ],
    subtitulos: [
      { desde: 2.5, hasta: 6.5, texto: "El sistema te avisa lo que está bajo el mínimo." },
      { desde: 6.5, hasta: 10, texto: "Y te arma el pedido para el proveedor." },
    ],
    cierre: "Se acabaron los faltantes de sorpresa.",
  },
];

export const FINAL = {
  titulo: "Primeros 100",
  texto: "1 mes gratis del sistema o 50 % en tu web o tu app.",
  link: "quvant.com.ar/primeros-100",
};

/** Los subtítulos completos en tiempo absoluto (para el .vtt y los quemados en la versión de redes). */
export function subtitulosAbsolutos() {
  return CAPITULOS.flatMap((c, i) => {
    const base = i * CAPITULO;
    return [
      { desde: base, hasta: base + 2.5, texto: c.problema },
      ...c.subtitulos.map((s) => ({ desde: base + s.desde, hasta: base + s.hasta, texto: s.texto })),
      { desde: base + 10, hasta: base + CAPITULO, texto: c.cierre },
    ];
  }).concat([{ desde: CAPITULO * 3, hasta: DURACION, texto: `${FINAL.titulo}: ${FINAL.texto}` }]);
}
