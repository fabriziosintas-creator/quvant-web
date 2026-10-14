import { PerspectiveCamera } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * Encuadre de la escena.
 *
 * R3F deja la cámara mirando al eje -Z del mundo, no al objeto: si no se
 * apunta, la escena queda corrida. En vez de girarla a mano (mutar algo
 * que devuelve un hook), se calcula acá la rotación que mira al objetivo
 * y se pasa como propiedad: declarativo y, sobre todo, idéntico en cada
 * render, que es lo que pide Remotion.
 */
export const Camara: React.FC<{
  posicion: [number, number, number];
  objetivo?: [number, number, number];
  fov?: number;
  cerca?: number;
  lejos?: number;
}> = ({ posicion, objetivo = [0, 0, 0], fov = 30, cerca = 0.1, lejos = 1200 }) => {
  const rotacion = useMemo(() => {
    const desde = new THREE.Vector3(...posicion);
    const hacia = new THREE.Vector3(...objetivo);
    const matriz = new THREE.Matrix4().lookAt(desde, hacia, new THREE.Vector3(0, 1, 0));
    return new THREE.Euler().setFromRotationMatrix(matriz);
  }, [posicion, objetivo]);

  return (
    <PerspectiveCamera makeDefault position={posicion} rotation={rotacion} fov={fov} near={cerca} far={lejos} />
  );
};
