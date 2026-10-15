import React from "react";
import { QChrome } from "../three/QChrome";
import { curvaMarca, tramo } from "./comun";
import { type Escena, SIN_MASCARA } from "./piezas";

/**
 * 0:40–0:45 · Cierre. Negro y la grilla quieta. La Q cromada entra desde
 * la derecha y termina derecha, con la cola abajo a la derecha; el punto,
 * que viene pegado a la cola, se separa y "se adelanta" un paso hasta su
 * lugar. Después, QUVANT y la bajada (SpotCompleto). Los últimos 2 s no se
 * mueve nada.
 *
 * La escena que revela el salto está vacía: la Q va en el lienzo principal
 * (como en el hero-loop), con el antialias del render final, y entra recién
 * cuando el revelado terminó.
 */

export const CIERRE: Escena = {
  id: "cierre",
  Contenido: () => null,
  camara: () => ({ posicion: [0, 0, 9], fov: 40 }),
  mascara: SIN_MASCARA,
};

/** La firma "Q. QUVANT" como la del manual (quvant-firma-transparente-blanca.pdf). */
export const FIRMA = {
  /** Ancho de QUVANT en Michroma con tracking 0,18 em, sin el tracking de la última letra (medido en Chrome). */
  quvantEm: 7.114,
  /** Lado del lienzo de la Q (105 unidades del manual), en em del logotipo. */
  ladoQEm: 1.9,
  /** Aire entre el lienzo de la Q y la Q de QUVANT. */
  espacioEm: 0.63,
  /** Las mayúsculas quedan apenas más abajo que el centro del lienzo de la Q. */
  bajaMayusculasEm: 0.075,
  /** Alto de las mayúsculas de Michroma. */
  mayusculasEm: 0.76,
};

/** Dónde va cada parte de la firma en un cuadro de ancho × alto (px). */
export function firma(ancho: number, alto: number) {
  const u = ancho / 3840;
  const tamano = 180 * u;
  const ladoQ = FIRMA.ladoQEm * tamano;
  const espacio = FIRMA.espacioEm * tamano;
  const total = ladoQ + espacio + FIRMA.quvantEm * tamano;
  const x0 = (ancho - total) / 2;
  const centroY = alto * 0.46;
  return {
    tamano,
    ladoQ,
    centroQ: [x0 + ladoQ / 2, centroY] as [number, number],
    textoX: x0 + ladoQ + espacio,
    centroMayusculas: centroY + FIRMA.bajaMayusculasEm * tamano,
    bajadaY: centroY + ladoQ / 2 + 120 * u,
  };
}

/** La Q del cierre en el lienzo principal (cámara en z = 9, fov 40). */
export const QCierre: React.FC<{ local: number; ancho: number; alto: number }> = ({ local, ancho, alto }) => {
  if (local < 0.9) return null;
  const f = firma(ancho, alto);
  const pxPorUnidad = alto / (2 * 9 * Math.tan((20 * Math.PI) / 180));
  const entrada = curvaMarca(tramo(local, 0.95, 2.45));
  const separa = curvaMarca(tramo(local, 2.4, 2.9));
  const x = (f.centroQ[0] - ancho / 2 + (1 - entrada) * ancho * 0.95) / pxPorUnidad;
  const y = (alto / 2 - f.centroQ[1]) / pxPorUnidad;
  return (
    <QChrome
      posicion={[x, y, 0]}
      rotacion={[(1 - entrada) * 0.2, (1 - entrada) * -1.05]}
      escala={f.ladoQ / pxPorUnidad / 105}
      adelanto={-0.8 * (1 - separa)}
      orden={10}
    />
  );
};
