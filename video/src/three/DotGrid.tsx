import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { colorVec3 } from "../brand/tokens";
import frag from "../shaders/grid.frag";
import vert from "../shaders/pantalla-completa.vert";

/**
 * La grilla de puntos del manual, dibujada por un shader propio
 * (src/shaders/grid.frag) sobre un plano que cubre todo el cuadro.
 *
 * El tiempo sale del cuadro de Remotion, nunca de un reloj de three.js:
 * cada render es idéntico. `periodo` es el largo del loop, para que el
 * respirar de la grilla cierre exacto.
 */
export const DotGrid: React.FC<{
  ancho: number;
  alto: number;
  /** Px entre puntos (48 a 4K; se escala con el cuadro). */
  paso?: number;
  periodo: number;
}> = ({ ancho, alto, paso, periodo }) => {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pasoPx = paso ?? Math.round((48 * ancho) / 3840);
  const segundos = cuadro / fps;
  // Parallax muy suave: menos del 2 % del cuadro, también periódico.
  const angulo = (2 * Math.PI * segundos) / periodo;
  const uniforms = {
    uResolucion: { value: [ancho, alto] },
    uPaso: { value: pasoPx },
    uLado: { value: Math.max(2, Math.round(pasoPx / 9)) },
    uTiempo: { value: segundos },
    uPeriodo: { value: periodo },
    uDesplazamiento: { value: [Math.cos(angulo) * ancho * 0.008, Math.sin(angulo) * alto * 0.008] },
    uFondo: { value: colorVec3("negro") },
    uPunto: { value: colorVec3("profundo") },
  };

  return (
    <ThreeCanvas width={ancho} height={alto} flat linear gl={{ antialias: false }}>
      <mesh frustumCulled={false}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} depthTest={false} />
      </mesh>
    </ThreeCanvas>
  );
};
