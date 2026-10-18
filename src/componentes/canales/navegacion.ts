import { CANALES } from "@/datos/textos";

/** El recorrido completo: la portada primero y después los canales en orden. */
const ORDEN: readonly string[] = ["/", ...CANALES.map((canal) => canal.ruta)];

/**
 * Hacia dónde se desliza la página al navegar: adelante si el destino está
 * más adelante en el recorrido, atrás si está antes. Lo usan los Link
 * (transitionTypes) y lo lee el <ViewTransition> de cada página.
 */
export function tipoTransicion(desde: string, hacia: string) {
  const origen = ORDEN.indexOf(desde);
  const destino = ORDEN.indexOf(hacia);
  if (origen < 0 || destino < 0 || origen === destino) return "canal-mismo";
  return destino > origen ? "canal-adelante" : "canal-atras";
}

/** Las clases de transición de una página entera, según el tipo de navegación. */
export const DESLIZ_PAGINA = {
  "canal-adelante": "paso-adelante",
  "canal-atras": "paso-atras",
  default: "none",
};

export function canalPorId(id: string) {
  const canal = CANALES.find((c) => c.id === id);
  if (!canal) throw new Error(`No existe el canal ${id}`);
  return canal;
}

/** El canal que sigue (y el último vuelve al primero, para que el recorrido no se corte). */
export function canalSiguiente(id: string) {
  const indice = CANALES.findIndex((c) => c.id === id);
  return CANALES[(indice + 1) % CANALES.length];
}

export const numeroCanal = (id: string) =>
  String(CANALES.findIndex((c) => c.id === id) + 1).padStart(2, "0");
