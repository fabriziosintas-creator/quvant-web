import { useTexture } from "@react-three/drei";
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { COLOR, hexVec3 } from "../brand/tokens";
import frag from "../shaders/screen-glass.frag";
import vert from "../shaders/screen-glass.vert";

/**
 * Una captura (o un cuadro de stock) sobre un plano 3D detrás de vidrio:
 * screen-glass.frag. La textura suspende (useTexture): ThreeCanvas retiene
 * el cuadro hasta que carga, así nunca sale un cuadro vacío.
 *
 * Toda la cadena trabaja con valores de pantalla (sRGB tal cual), así que
 * la textura no se convierte.
 */

export type PropsGlassScreen = {
  src: string;
  /** Ancho del plano en unidades del mundo; el alto sale de la imagen. */
  ancho: number;
  posicion?: [number, number, number];
  rotacion?: [number, number, number];
  opacidad?: number;
  saturacion?: number;
};

export const GlassScreen: React.FC<PropsGlassScreen> = ({
  src,
  ancho,
  posicion = [0, 0, 0],
  rotacion = [0, 0, 0],
  opacidad = 1,
  saturacion = 1,
}) => {
  const textura = useTexture(src);

  useLayoutEffect(() => {
    textura.colorSpace = THREE.NoColorSpace;
    textura.anisotropy = 8;
    textura.needsUpdate = true;
  }, [textura]);

  const imagen = textura.image as { width: number; height: number };
  const alto = ancho * (imagen.height / imagen.width);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMapa: { value: textura },
          uOpacidad: { value: opacidad },
          uSaturacion: { value: saturacion },
          uRefraccion: { value: 0.002 },
          uReflejo: { value: 0.015 },
          uBlanco: { value: new THREE.Vector3(...hexVec3(COLOR.blanco)) },
        },
      }),
    [textura, opacidad, saturacion],
  );

  return (
    <mesh position={posicion} rotation={rotacion} material={material}>
      <planeGeometry args={[ancho, alto]} />
    </mesh>
  );
};
