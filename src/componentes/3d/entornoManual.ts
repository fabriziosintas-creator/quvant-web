import * as THREE from "three";

/**
 * Entorno elegido para el cromo de la Q (variante D del laboratorio):
 * un degradado equirectangular con las siete paradas exactas del degradado
 * oficial del manual. La Q refleja, literalmente, el color del logo.
 *
 * La textura se crea una sola vez por pestaña, fuera de React, y la
 * comparten todos los lienzos que la pidan. Solo puede llamarse en el
 * navegador (usa document), igual que todo el 3D del sitio.
 */

/** Paradas exactas del degradado de cromo del manual, de arriba hacia abajo. */
export const PARADAS_MANUAL: Array<[number, string]> = [
  [0, "#FFFFFF"],
  [0.1667, "#D9DCE0"],
  [0.3333, "#3A3D42"],
  [0.5, "#F2F4F6"],
  [0.6667, "#6C7076"],
  [0.8333, "#FFFFFF"],
  [1, "#9DA1A7"],
];

let texturaManual: THREE.CanvasTexture | null = null;

export function obtenerEntornoManual(): THREE.CanvasTexture {
  if (texturaManual) return texturaManual;
  const lienzo = document.createElement("canvas");
  lienzo.width = 1024;
  lienzo.height = 512;
  const contexto = lienzo.getContext("2d");
  if (contexto) {
    const degradado = contexto.createLinearGradient(0, 0, 0, lienzo.height);
    for (const [posicion, color] of PARADAS_MANUAL) {
      degradado.addColorStop(posicion, color);
    }
    contexto.fillStyle = degradado;
    contexto.fillRect(0, 0, lienzo.width, lienzo.height);
  }
  texturaManual = new THREE.CanvasTexture(lienzo);
  texturaManual.mapping = THREE.EquirectangularReflectionMapping;
  texturaManual.colorSpace = THREE.SRGBColorSpace;
  return texturaManual;
}
