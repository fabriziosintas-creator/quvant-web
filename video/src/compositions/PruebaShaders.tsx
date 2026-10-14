import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR } from "../brand/tokens";
import { GrillaDePuntos } from "../three/DotGrid";
import { GlassScreen } from "../three/GlassScreen";
import { CadenaPost } from "../three/Gradacion";
import { QChrome } from "../three/QChrome";
import { Salto3D, cuadrosDelSalto } from "../transitions/Jump";

/**
 * Paso 4 del brief 4K: los cinco shaders juntos en una prueba corta.
 *  - Escena A: la grilla (grid.frag) y la Q cromada (chrome.frag) girando.
 *  - El salto (jump.vert + jump.frag) lleva a la escena B: dos capturas
 *    reales de Forja y Yunque en planos de vidrio (screen-glass.frag).
 *  - Encima de todo: bloom muy leve, aberración mínima y la gradación
 *    (grade.frag).
 *
 * QSola4K: la Q sola, en 4K, sin postproceso, para compararla con la del sitio.
 */

export const PRUEBA = { ancho: 1920, alto: 1080, fps: 30, duracion: 120, inicioSalto: 40 };

export const PruebaShaders: React.FC = () => {
  const cuadro = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const salto = cuadrosDelSalto(fps);
  const progreso = interpolate(cuadro, [PRUEBA.inicioSalto, PRUEBA.inicioSalto + salto.total], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const giro = interpolate(cuadro, [0, durationInFrames], [-0.35, 0.55]);
  const periodo = durationInFrames / fps;

  const escenaA = (
    <>
      <GrillaDePuntos ancho={width} alto={height} periodo={periodo} />
      <QChrome rotacion={[0.1, giro]} posicion={[1.4, 0, 0]} />
    </>
  );

  const deriva = interpolate(cuadro, [0, durationInFrames], [0.12, -0.04]);
  const escenaB = (
    <>
      <GrillaDePuntos ancho={width} alto={height} periodo={periodo} />
      <GlassScreen
        src={staticFile("capturas/yunque-tablero.webp")}
        ancho={5.4}
        posicion={[-1.2, 0.6, -2.2]}
        rotacion={[0, 0.32 + deriva, 0]}
        opacidad={0.55}
      />
      <GlassScreen
        src={staticFile("capturas/forja-constelacion.webp")}
        ancho={6.2}
        posicion={[1.6, -0.3, 0]}
        rotacion={[0.04, -0.22 + deriva, 0]}
      />
    </>
  );

  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <ThreeCanvas width={width} height={height} flat linear gl={{ antialias: false }}>
        <Salto3D
          ancho={width}
          alto={height}
          progreso={progreso}
          corte={salto.corte}
          origen={[width * 0.09, height * 0.86]}
          destino={[width * 0.63, height * 0.47]}
          escenaA={escenaA}
          escenaB={escenaB}
          camaraA={{ posicion: [0, 0, 9], fov: 40 }}
          camaraB={{ posicion: [0, 0.2, 9], fov: 40 }}
        />
        <CadenaPost ancho={width} alto={height} cuadro={cuadro} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

/**
 * La Q sola, en 4K: el material de cromo sin postproceso, sobre el negro.
 * El lienzo queda transparente: el negro es el del fondo (#0D0D0F exacto);
 * un <color> de three se convertiría a lineal y saldría casi negro puro.
 */
export const QSola: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <ThreeCanvas width={width} height={height} flat linear camera={{ position: [0, 0, 9], fov: 40 }}>
        <QChrome rotacion={[0.08, 0.3]} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
