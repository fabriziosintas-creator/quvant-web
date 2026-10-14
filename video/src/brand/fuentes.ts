import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { FUENTE } from "./tokens";

/**
 * Carga Michroma e IBM Plex Mono desde public/fonts (nunca desde Google
 * Fonts en tiempo de render) y retiene el render hasta que estén listas.
 */
export function useFuentes() {
  const [espera] = useState(() => delayRender("cargando fuentes de la marca"));
  useEffect(() => {
    const fuentes = [FUENTE.michroma, FUENTE.plex].map(
      (f) => new FontFace(f.familia, `url(${staticFile(f.archivo)})`),
    );
    Promise.all(fuentes.map((f) => f.load()))
      .then((cargadas) => {
        cargadas.forEach((f) => document.fonts.add(f));
        continueRender(espera);
      })
      .catch((error) => cancelRender(error));
  }, [espera]);
}
