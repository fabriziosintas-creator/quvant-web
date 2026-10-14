import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import * as THREE from "three";
import { COLOR, hexVec3 } from "../brand/tokens";
import frag from "../shaders/screen-glass.frag";
import vert from "../shaders/screen-glass.vert";

/**
 * Capturas y stock sobre planos 3D detrás de vidrio (screen-glass.frag).
 *
 * Toda la cadena trabaja con valores de pantalla (sRGB tal cual), así que
 * las texturas no se convierten.
 */

type PropsPlano = {
  /** Ancho del plano en unidades del mundo; el alto sale del aspecto. */
  ancho: number;
  posicion?: [number, number, number];
  rotacion?: [number, number, number];
  opacidad?: number;
  saturacion?: number;
};

/** El plano con su vidrio, para cualquier textura. */
const PlanoDeVidrio: React.FC<PropsPlano & { textura: THREE.Texture; aspecto: number }> = ({
  textura,
  aspecto,
  ancho,
  posicion = [0, 0, 0],
  rotacion = [0, 0, 0],
  opacidad = 1,
  saturacion = 1,
}) => {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMapa: { value: textura },
          uOpacidad: { value: 1 },
          uSaturacion: { value: 1 },
          uRefraccion: { value: 0.002 },
          uReflejo: { value: 0.015 },
          uBlanco: { value: new THREE.Vector3(...hexVec3(COLOR.blanco)) },
        },
      }),
    [textura],
  );

  useLayoutEffect(() => {
    material.uniforms.uOpacidad.value = opacidad;
    material.uniforms.uSaturacion.value = saturacion;
  }, [material, opacidad, saturacion]);

  return (
    <mesh position={posicion} rotation={rotacion} material={material}>
      <planeGeometry args={[ancho, ancho / aspecto]} />
    </mesh>
  );
};

/**
 * Una imagen fija (una captura). La textura suspende (useTexture):
 * ThreeCanvas retiene el cuadro hasta que carga.
 */
export const GlassScreen: React.FC<PropsPlano & { src: string }> = ({ src, ...plano }) => {
  const textura = useTexture(src);

  useLayoutEffect(() => {
    textura.colorSpace = THREE.NoColorSpace;
    textura.anisotropy = 8;
    textura.needsUpdate = true;
  }, [textura]);

  const imagen = textura.image as { width: number; height: number };
  return <PlanoDeVidrio textura={textura} aspecto={imagen.width / imagen.height} {...plano} />;
};

/**
 * Una textura que cambia de imagen en cada cuadro (una secuencia de stock).
 * Hay una sola textura y se le cambia la imagen: no se acumulan cientos en
 * memoria. Mientras la imagen nueva carga, el cuadro queda retenido
 * (delayRender); al llegar, se vuelve a dibujar la escena (advance) antes de
 * soltarlo, así el cuadro nunca sale con la imagen vieja.
 */
function useTexturaDeSecuencia(url: string) {
  const [textura] = useState(() => {
    const t = new THREE.Texture();
    t.colorSpace = THREE.NoColorSpace;
    t.anisotropy = 4;
    return t;
  });
  const avanzar = useThree((estado) => estado.advance);

  useLayoutEffect(() => {
    let vigente = true;
    let suelto = false;
    const espera = delayRender(`Cuadro de stock ${url}`);
    const soltar = () => {
      if (suelto) return;
      suelto = true;
      continueRender(espera);
    };
    const imagen = new Image();
    imagen.onload = () => {
      if (!vigente) return;
      textura.image = imagen;
      textura.needsUpdate = true;
      avanzar(performance.now());
      soltar();
    };
    imagen.onerror = () => cancelRender(new Error(`No cargó ${url}`));
    imagen.src = url;
    return () => {
      vigente = false;
      soltar();
    };
  }, [url, textura, avanzar]);

  return textura;
}

export const GlassSecuencia: React.FC<PropsPlano & { url: string; aspecto: number }> = ({
  url,
  aspecto,
  ...plano
}) => {
  const textura = useTexturaDeSecuencia(url);
  return <PlanoDeVidrio textura={textura} aspecto={aspecto} {...plano} />;
};
