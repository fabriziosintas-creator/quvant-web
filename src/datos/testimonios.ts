/**
 * Testimonios reales (web más humana, paso 7). Vacío hasta que alguien
 * (por ejemplo, de Ferremix) dé una frase real con su nombre, su cargo y
 * su permiso. El bloque de la web no aparece mientras esté vacío.
 *
 * ┌───────────────────────────────────────────────────────────────┐
 * │  TODO: fabrizio anota las frases reales en marca/testimonios.txt │
 * │  (nombre, cargo, empresa, permiso) y las pasa acá. Nunca se      │
 * │  inventa ninguna.                                               │
 * └───────────────────────────────────────────────────────────────┘
 */

export type Testimonio = {
  cita: string;
  nombre: string;
  cargo: string;
  empresa: string;
  /** El id de la foto en src/datos/fotos.ts, si hay permiso. */
  foto?: string;
};

export const TESTIMONIOS: readonly Testimonio[] = [];
