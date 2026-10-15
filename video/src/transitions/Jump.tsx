import { useFBO } from "@react-three/drei";
import { createPortal, useFrame } from "@react-three/fiber";
import React, { useMemo, useState } from "react";
import * as THREE from "three";
import { COLOR, hexVec3 } from "../brand/tokens";
import frag from "../shaders/jump.frag";
import vert from "../shaders/jump.vert";

/**
 * "El salto" en 3D: la única transición del video, como pase de
 * postproceso (jump.vert + jump.frag). Las dos escenas se dibujan cada una
 * en su textura (con su cámara) y el pase las combina: el punto vuela sobre
 * A y, al aterrizar, B se abre desde ese punto.
 *
 * Va dentro de un <ThreeCanvas>; el resto de la cadena (bloom, aberración,
 * gradación) se aplica encima con <EffectComposer>.
 */

export type Camara = { posicion: [number, number, number]; mira?: [number, number, number]; fov?: number };

export { cuadrosDelSalto } from "./tiempos";

function useCamara(c: Camara, aspecto: number) {
  return useMemo(() => {
    const camara = new THREE.PerspectiveCamera(c.fov ?? 40, aspecto, 0.1, 200);
    camara.position.set(...c.posicion);
    camara.lookAt(new THREE.Vector3(...(c.mira ?? [0, 0, 0])));
    camara.updateProjectionMatrix();
    return camara;
  }, [c.fov, c.posicion, c.mira, aspecto]);
}

export const Salto3D: React.FC<{
  ancho: number;
  alto: number;
  /** 0..1: vuelo y revelado. Con 0 se ve solo A; con 1, solo B. */
  progreso: number;
  corte: number;
  /** Px, origen arriba-izquierda. */
  origen: [number, number];
  destino: [number, number];
  lado?: number;
  escenaA: React.ReactNode;
  escenaB: React.ReactNode;
  camaraA: Camara;
  camaraB: Camara;
  /** Desenfoque de profundidad de las dos escenas, en px (0 = nítido). */
  desenfoque?: number;
  /** El contenido se funde hacia la izquierda, de [0] a [1] del ancho. */
  mascaraX?: [number, number];
  /** La máscara de B, si no es la misma que la de A. */
  mascaraXB?: [number, number];
  /** 0..1: el punto ya visible en el origen antes de saltar (el parpadeo). */
  antes?: number;
  /** Antialias de las texturas de las escenas. Desenfocadas no hace falta, y a 4K pesa. */
  muestras?: number;
}> = ({
  ancho,
  alto,
  progreso,
  corte,
  origen,
  destino,
  lado,
  escenaA,
  escenaB,
  camaraA,
  camaraB,
  desenfoque = 0,
  mascaraX = [0, 0],
  mascaraXB,
  antes = 0,
  muestras = 4,
}) => {
  const aspecto = ancho / alto;
  const [mundoA] = useState(() => new THREE.Scene());
  const [mundoB] = useState(() => new THREE.Scene());
  const camA = useCamara(camaraA, aspecto);
  const camB = useCamara(camaraB, aspecto);
  const texturaA = useFBO(ancho, alto, { samples: muestras });
  const texturaB = useFBO(ancho, alto, { samples: muestras });

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        depthTest: false,
        depthWrite: false,
        // Las escenas pueden traer fondo transparente: se compone premultiplicado.
        transparent: true,
        premultipliedAlpha: true,
        uniforms: {
          uSceneA: { value: texturaA.texture },
          uSceneB: { value: texturaB.texture },
          uProgress: { value: 0 },
          uCorte: { value: corte },
          uJumpOrigin: { value: new THREE.Vector2() },
          uJumpTarget: { value: new THREE.Vector2() },
          uResolucion: { value: new THREE.Vector2(ancho, alto) },
          uLado: { value: 16 },
          uColorPunto: { value: new THREE.Vector3(...hexVec3(COLOR.blanco)) },
          uDesenfoque: { value: 0 },
          uMascaraX: { value: new THREE.Vector2() },
          uMascaraXB: { value: new THREE.Vector2() },
          uAntes: { value: 0 },
        },
      }),
    [texturaA, texturaB, corte, ancho, alto],
  );

  // Las dos escenas a sus texturas, antes del cuadro final (prioridad negativa).
  useFrame(({ gl }) => {
    const u = material.uniforms;
    u.uProgress.value = Math.min(1, Math.max(0, progreso));
    u.uJumpOrigin.value.set(...origen);
    u.uJumpTarget.value.set(...destino);
    u.uLado.value = lado ?? Math.round((16 * ancho) / 1600);
    u.uDesenfoque.value = desenfoque;
    u.uMascaraX.value.set(...mascaraX);
    u.uMascaraXB.value.set(...(mascaraXB ?? mascaraX));
    u.uAntes.value = antes;
    // Cada textura se limpia antes de dibujar: la cadena de postprocessing
    // apaga el autoClear del renderer, y sin esto cada pestaña del render
    // arrastra lo que dibujó en cuadros anteriores (estelas y planos de
    // escenas que ya pasaron).
    const anterior = gl.getRenderTarget();
    if (progreso < 1) {
      gl.setRenderTarget(texturaA);
      gl.clear();
      gl.render(mundoA, camA);
    }
    if (progreso > corte * 0.98) {
      gl.setRenderTarget(texturaB);
      gl.clear();
      gl.render(mundoB, camB);
    }
    gl.setRenderTarget(anterior);
  }, -1);

  return (
    <>
      {createPortal(escenaA, mundoA)}
      {createPortal(escenaB, mundoB)}
      <mesh frustumCulled={false} material={material} renderOrder={-10}>
        <planeGeometry args={[2, 2]} />
      </mesh>
    </>
  );
};
