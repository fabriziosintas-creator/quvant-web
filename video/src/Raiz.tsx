import React from "react";
import { Still } from "remotion";
import { MuestraPantalla } from "./muestras/MuestraPantalla";

/**
 * Composiciones del video de portada.
 *
 * Por ahora están solo las dos muestras para elegir el tratamiento de las
 * capturas. PortadaCorta, PortadaCortaCelular y PortadaLarga se registran
 * acá cuando estén las capturas del sistema.
 */
export const Raiz: React.FC = () => {
  return (
    <>
      <Still
        id="MuestraMono"
        component={MuestraPantalla}
        width={1920}
        height={1080}
        defaultProps={{
          archivoPantalla: "pantallas/ferremix-nueva-escritorio-mono.webp",
          etiqueta: "A · Monocromo",
        }}
      />
      <Still
        id="MuestraColor35"
        component={MuestraPantalla}
        width={1920}
        height={1080}
        defaultProps={{
          archivoPantalla: "pantallas/ferremix-nueva-escritorio-color35.webp",
          etiqueta: "B · Color al 35 %",
        }}
      />
    </>
  );
};
