import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect } from "react";
import * as THREE from "three";

/**
 * Encuadre explícito. R3F deja la cámara mirando al eje -Z del mundo, no
 * al objeto: si no se apunta a mano, la escena queda corrida. Acá se fija
 * posición y objetivo por cuadro, que además es lo que después anima el
 * travelling de cada escena.
 */
export const Camara: React.FC<{
  posicion: [number, number, number];
  objetivo?: [number, number, number];
  fov?: number;
}> = ({ posicion, objetivo = [0, 0, 0], fov = 30 }) => {
  const camara = useThree((estado) => estado.camera);

  useLayoutEffect(() => {
    camara.position.set(...posicion);
    camara.lookAt(new THREE.Vector3(...objetivo));
    if (camara instanceof THREE.PerspectiveCamera) {
      camara.fov = fov;
    }
    camara.updateProjectionMatrix();
  });

  return null;
};
