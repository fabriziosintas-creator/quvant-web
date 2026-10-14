import { Environment, Lightformer } from "@react-three/drei";
import React from "react";

/**
 * Estudio en blanco y negro: paneles de luz blancos sobre negro, que son
 * los que se reflejan en el cromo y en los bordes de los dispositivos.
 * Sin HDR de colores, como pide el manual (nada fuera de la paleta).
 */
export const Estudio: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.12} />
      {/* Luz rasante: entra casi paralela al piso y dibuja las crestas. */}
      <directionalLight position={[-60, 14, 40]} intensity={2.6} color="#FFFFFF" />
      <directionalLight position={[40, 30, -30]} intensity={0.5} color="#FFFFFF" />

      <Environment resolution={256} frames={1} background={false}>
        <color attach="background" args={["#000000"]} />
        {/* Panel principal, el que da el brillo largo del cromo. */}
        <Lightformer form="rect" intensity={6} position={[-14, 10, 12]} scale={[18, 30, 1]} target={[0, 0, 0]} />
        {/* Contraluz que dibuja el borde de los dispositivos. */}
        <Lightformer form="rect" intensity={3} position={[16, 8, -14]} scale={[14, 20, 1]} target={[0, 0, 0]} />
        {/* Barra fina arriba: el reflejo alargado típico del metal pulido. */}
        <Lightformer form="rect" intensity={4} position={[0, 24, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[32, 3, 1]} />
      </Environment>
    </>
  );
};
