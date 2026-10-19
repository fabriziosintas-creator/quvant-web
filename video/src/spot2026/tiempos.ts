/**
 * La línea de tiempo del spot 2026, en segundos. La comparten la imagen
 * (Spot2026.tsx) y la música (scripts/componer-musica-2026.ts): cada corte
 * cae en un golpe de la música, y cada efecto de sonido, en su corte.
 *
 * 120 BPM: un pulso = 0,5 s, un compás = 2 s.
 */

export const BPM = 120;
export const PULSO = 60 / BPM;
export const COMPAS = PULSO * 4;

export const DURACION = 42;
export const FPS = 60;
export const CUADROS = DURACION * FPS;

/** Los bloques del spot. */
export const T = {
  /** La tele: estática y QUVANT borroso. */
  tele: 0,
  /** Engancha la señal: QUVANT nítido. */
  enganche: 2,
  /** El problema, en palabras que caen con el pulso. */
  problema: 4,
  /** Un respiro antes del drop (silencio). */
  respiro: 7.75,
  /** Cae el beat: los trabajos. */
  trabajos: 8,
  /** La pared con todo: Webs. Sistemas. Apps. */
  pared: 20,
  /** El método, con la música más baja. */
  metodo: 24,
  /** Vuelve a subir. */
  subida: 32,
  /** La Q y la firma. */
  firma: 36,
} as const;

/** Las palabras del problema, cada una en su pulso. */
export const PALABRAS_PROBLEMA: readonly { t: number; texto: string; grande?: boolean }[] = [
  { t: 4.0, texto: "Planillas." },
  { t: 4.5, texto: "Cuadernos." },
  { t: 5.0, texto: "Mil mensajes." },
  { t: 5.5, texto: "Sistemas que no se hablan." },
  // Sin punto: el punto es el cuadrado verde de la marca.
  { t: 6.5, texto: "Lo ordenamos", grande: true },
];

/** Los trabajos: uno por compás, desde el drop. */
export const TRABAJOS = [
  { id: "grimm", t: 8 },
  { id: "yunque", t: 10 },
  { id: "forja", t: 12 },
  { id: "hackfit", t: 14 },
  { id: "firmamento", t: 16 },
  { id: "gene-keys", t: 18 },
] as const;

/** La pared: una palabra por compás... casi (la última cierra el bloque). */
export const PALABRAS_PARED: readonly { t: number; texto: string }[] = [
  { t: 20.0, texto: "Webs." },
  { t: 21.0, texto: "Sistemas." },
  { t: 22.0, texto: "Apps." },
  { t: 23.0, texto: "A tu medida." },
];

/** Las cuatro etapas del método, un compás cada una. */
export const ETAPAS = [
  { id: "escuchar", t: 24, titulo: "Escuchamos.", nota: "Primero entender tu negocio." },
  { id: "sonar", t: 26, titulo: "Soñamos en grande.", nota: "La idea entera, sin recortes." },
  { id: "bajar", t: 28, titulo: "Lo bajamos a tierra.", nota: "Un plan que se empieza el lunes." },
  { id: "construir", t: 30, titulo: "Lo construimos por fases.", nota: "Y seguimos cerca." },
] as const;

/** Los cortes duros con barrido de sonido (los de los trabajos y el método). */
export const BARRIDOS = [
  ...TRABAJOS.slice(1).map((x) => x.t),
  T.pared,
  ...ETAPAS.slice(1).map((x) => x.t),
];
