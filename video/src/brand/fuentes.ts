import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { FUENTE } from "./tokens";

/**
 * Michroma e IBM Plex Mono (Regular y Bold) desde public/fonts: nunca desde
 * Google Fonts en tiempo de render.
 *
 * La carga es una sola promesa por página: el DOM la espera con
 * useFuentes (delayRender) y lo que dibuja texto dentro del lienzo 3D (un
 * <canvas> 2D como textura) la espera con use(cargarFuentes()), que
 * suspende y deja que ThreeCanvas retenga el cuadro.
 */

let promesa: Promise<void> | null = null;

export function cargarFuentes(): Promise<void> {
  if (!promesa) {
    const fuentes = Object.values(FUENTE).map(
      (f) => new FontFace(f.familia, `url(${staticFile(f.archivo)})`, { weight: String(f.peso) }),
    );
    promesa = Promise.all(fuentes.map((f) => f.load())).then((cargadas) => {
      cargadas.forEach((f) => document.fonts.add(f));
    });
  }
  return promesa;
}

/** Retiene el render hasta que las fuentes de la marca estén listas. */
export function useFuentes() {
  const [espera] = useState(() => delayRender("cargando fuentes de la marca"));
  useEffect(() => {
    cargarFuentes()
      .then(() => continueRender(espera))
      .catch((error) => cancelRender(error));
  }, [espera]);
}
