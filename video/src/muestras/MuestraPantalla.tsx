import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { COLORES } from "../marca";
import { Camara } from "../escena/Camara";
import { Estudio } from "../escena/Estudio";
import { PisoDeOndas } from "../escena/PisoDeOndas";
import { Notebook } from "../dispositivos/Notebook";

/**
 * Cuadro fijo para decidir el tratamiento de las capturas: la misma
 * notebook con la misma pantalla, una vez en monocromo y otra con los
 * colores al 35 %. No es una escena del video: es la muestra para elegir.
 */

type Props = {
  archivoPantalla: string;
  etiqueta: string;
};

export const MuestraPantalla: React.FC<Props> = ({ archivoPantalla, etiqueta }) => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORES.negro }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ fov: 28, near: 0.1, far: 1200 }}
        gl={{ antialias: true }}
      >
        {/* La notebook mide 32 de ancho: a 110 de distancia entra entera
            con aire alrededor. */}
        <Camara posicion={[52, 40, 88]} objetivo={[0, 3, 0]} fov={28} />
        <Estudio />
        <PisoDeOndas segundo={0} />
        <group position={[0, -2, 0]} rotation={[0, -0.42, 0]}>
          <Notebook archivoPantalla={archivoPantalla} apertura={1} />
        </group>
      </ThreeCanvas>

      {/* Etiqueta solo para esta muestra: no va en el video. */}
      <div
        style={{
          position: "absolute",
          left: 48,
          bottom: 40,
          color: COLORES.acero,
          fontFamily: "monospace",
          fontSize: 26,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        {etiqueta}
      </div>
    </AbsoluteFill>
  );
};
