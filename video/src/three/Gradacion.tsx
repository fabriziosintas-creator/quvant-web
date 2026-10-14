import { useFrame, useThree } from "@react-three/fiber";
import {
  BloomEffect,
  ChromaticAberrationEffect,
  Effect,
  EffectComposer,
  EffectPass,
  RenderPass,
} from "postprocessing";
import React, { useEffect, useMemo } from "react";
import { HalfFloatType, Uniform, Vector2, Vector3 } from "three";
import { colorVec3 } from "../brand/tokens";
import frag from "../shaders/grade.frag";

/**
 * grade.frag como efecto de postprocessing. Los valores por defecto son los
 * del brief: viñeta 0.25, scanline 0.02, grano 0.015 y negros a #0D0D0F.
 */
export class EfectoGradacion extends Effect {
  constructor() {
    super("Gradacion", frag, {
      uniforms: new Map<string, Uniform>([
        ["uNegro", new Uniform(new Vector3(...colorVec3("negro")))],
        ["uSaturacion", new Uniform(1)],
        ["uVineta", new Uniform(0.25)],
        ["uScanline", new Uniform(0.02)],
        ["uGrano", new Uniform(0.015)],
        ["uCuadro", new Uniform(0)],
        ["uPeriodo", new Uniform(1e9)],
      ]),
    });
  }
}

/**
 * La cadena final de todo el video, armada a mano con postprocessing:
 * bloom muy leve y aberración mínima, y después la gradación.
 *
 * No se usa <EffectComposer> de @react-three/postprocessing: en el render
 * de Remotion (un solo avance por cuadro) dejaba el lienzo vacío, porque
 * arma sus buffers después del primer cuadro. Acá el compositor nace con
 * su tamaño y dibuja en el mismo avance (prioridad 1: reemplaza el render
 * normal de R3F).
 */
export const CadenaPost: React.FC<{
  ancho: number;
  alto: number;
  /** El cuadro de Remotion: siembra el grano. */
  cuadro: number;
  /** Largo del loop en cuadros: el grano se repite exacto. */
  periodo?: number;
  saturacion?: number;
}> = ({ ancho, alto, cuadro, periodo = 1e9, saturacion = 1 }) => {
  const { gl, scene, camera } = useThree();

  const cadena = useMemo(() => {
    const compositor = new EffectComposer(gl, { frameBufferType: HalfFloatType, multisampling: 0 });
    compositor.addPass(new RenderPass(scene, camera));
    const bloom = new BloomEffect({
      luminanceThreshold: 0.82,
      luminanceSmoothing: 0.12,
      intensity: 0.18,
      mipmapBlur: true,
    });
    const aberracion = new ChromaticAberrationEffect({
      offset: new Vector2(0.0005, 0.0003),
      radialModulation: false,
      modulationOffset: 0,
    });
    const gradacion = new EfectoGradacion();
    // La aberración es una convolución: va en su propio pase.
    compositor.addPass(new EffectPass(camera, bloom));
    compositor.addPass(new EffectPass(camera, aberracion));
    compositor.addPass(new EffectPass(camera, gradacion));
    compositor.setSize(ancho, alto, false);
    return { compositor, gradacion };
  }, [gl, scene, camera, ancho, alto]);

  useEffect(() => () => cadena.compositor.dispose(), [cadena]);

  useFrame(() => {
    const u = cadena.gradacion.uniforms;
    u.get("uCuadro")!.value = cuadro;
    u.get("uPeriodo")!.value = periodo;
    u.get("uSaturacion")!.value = saturacion;
    cadena.compositor.render();
  }, 1);

  return null;
};
