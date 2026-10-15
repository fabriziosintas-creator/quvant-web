import { type Escena, SIN_MASCARA } from "./piezas";

/**
 * 0:00–0:03 · Apertura. Negro; aparece la grilla y un punto parpadea (los
 * dos los pone SpotCompleto: la grilla va detrás de todo y el punto es el
 * mismo que después salta). La escena en sí está vacía.
 */
export const APERTURA: Escena = {
  id: "apertura",
  Contenido: () => null,
  camara: () => ({ posicion: [0, 0, 9], fov: 40 }),
  mascara: SIN_MASCARA,
};
