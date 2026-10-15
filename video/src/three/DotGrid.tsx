import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { colorVec3 } from "../brand/tokens";
import frag from "../shaders/grid.frag";
import vert from "../shaders/pantalla-completa.vert";
import ruido from "../shaders/ruido.glsl";

/**
 * La grilla de puntos del manual, dibujada por un shader propio
 * (src/shaders/grid.frag, con el ruido simplex de ruido.glsl) sobre un
 * plano que cubre todo el cuadro.
 *
 * El tiempo sale del cuadro de Remotion, nunca de un reloj de three.js:
 * cada render es idéntico. `periodo` es el largo del loop, para que el
 * respirar de la grilla cierre exacto.
 */

const FRAGMENTO = `${ruido}\n${frag}`;

type Props = {
  ancho: number;
  alto: number;
  /** Px entre puntos (48 a 4K; se escala con el cuadro). */
  paso?: number;
  periodo: number;
  /** 1 = la grilla del manual. */
  opacidad?: number;
  /** Opacidad en el lado izquierdo (el hero-loop: 0.6 en el tercio del texto). */
  izquierda?: number;
  /** Dónde pasa de `izquierda` a la opacidad plena, en fracción del ancho. */
  transicion?: [number, number];
  /** El tiempo de la grilla, si no es el del cuadro (el cierre del spot la deja quieta). */
  segundos?: number;
};

/**
 * El centro del punto de la grilla más cercano a (fx, fy), en px con origen
 * arriba-izquierda: de ahí sale el salto. Usa el mismo paso y el mismo
 * parallax que el shader.
 */
export function puntoDeGrilla(
  [fx, fy]: [number, number],
  ancho: number,
  alto: number,
  segundos: number,
  periodo: number,
): [number, number] {
  const paso = Math.round((48 * ancho) / 3840);
  const angulo = (2 * Math.PI * segundos) / periodo;
  const dx = Math.cos(angulo) * ancho * 0.008;
  const dy = Math.sin(angulo) * alto * 0.008;
  const x = fx * ancho;
  const y = (1 - fy) * alto; // la grilla cuenta desde abajo
  const sx = Math.round((x + dx - paso / 2) / paso) * paso + paso / 2 - dx;
  const sy = Math.round((y + dy - paso / 2) / paso) * paso + paso / 2 - dy;
  return [sx, alto - sy];
}

/** La grilla como pieza de cualquier escena R3F: detrás de todo, a pantalla completa. */
export const GrillaDePuntos: React.FC<Props> = ({
  ancho,
  alto,
  paso,
  periodo,
  opacidad = 1,
  izquierda = 1,
  transicion = [0.33, 0.45],
  segundos: segundosFijos,
}) => {
  const cuadro = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pasoPx = paso ?? Math.round((48 * ancho) / 3840);
  const segundos = segundosFijos ?? cuadro / fps;
  // Parallax muy suave: menos del 2 % del cuadro, también periódico.
  const angulo = (2 * Math.PI * segundos) / periodo;
  const uniforms = {
    uResolucion: { value: [ancho, alto] },
    uPaso: { value: pasoPx },
    uLado: { value: Math.max(2, Math.round(pasoPx / 9)) },
    uTiempo: { value: segundos },
    uPeriodo: { value: periodo },
    uDesplazamiento: { value: [Math.cos(angulo) * ancho * 0.008, Math.sin(angulo) * alto * 0.008] },
    uOpacidad: { value: opacidad },
    uIzquierda: { value: izquierda },
    uTransicion: { value: transicion },
    uFondo: { value: colorVec3("negro") },
    uPunto: { value: colorVec3("profundo") },
  };

  return (
    <mesh frustumCulled={false} renderOrder={-20}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vert}
        fragmentShader={FRAGMENTO}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};

/** La grilla sola, en su propio lienzo (la usa el salto en CSS de ForjaRecorrido). */
export const DotGrid: React.FC<Props> = (props) => (
  <ThreeCanvas width={props.ancho} height={props.alto} flat linear gl={{ antialias: false }}>
    <GrillaDePuntos {...props} />
  </ThreeCanvas>
);
