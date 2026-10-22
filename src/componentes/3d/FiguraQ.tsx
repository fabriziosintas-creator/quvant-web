"use client";

import { useEffect, useMemo, type Ref } from "react";
import * as THREE from "three";

/**
 * La Q de la marca en 3D (la misma geometría que la Q de cromo de la
 * portada y del laboratorio): el aro, la cola y el punto cuadrado. Recibe
 * los materiales (cada escena decide el cromo y el color del punto) y,
 * si hace falta moverlas, las referencias del grupo y del punto.
 * Las coordenadas son las del logo (unidades del SVG); la escena la
 * achica con ESCALA_Q.
 */

export const ESCALA_Q = 0.042;
export const PUNTO_Q = new THREE.Vector3(39, -39, 0);
const ARO_CENTRO = new THREE.Vector3(-8.5, 8.5, 0);
const COLA_INICIO = new THREE.Vector3(10.5, -10.5, 0);
const COLA_LARGO = Math.hypot(17, 17);

export function FiguraQ({
  cromo,
  punto,
  raiz,
  refPunto,
}: {
  cromo: THREE.Material;
  punto: THREE.Material;
  raiz?: Ref<THREE.Group>;
  refPunto?: Ref<THREE.Mesh>;
}) {
  const geometriaPunto = useMemo(() => {
    const forma = new THREE.Shape();
    forma.moveTo(-5.5, -5.5);
    forma.lineTo(5.5, -5.5);
    forma.lineTo(5.5, 5.5);
    forma.lineTo(-5.5, 5.5);
    forma.closePath();
    const g = new THREE.ExtrudeGeometry(forma, { depth: 7, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.2, bevelSegments: 4 });
    g.center();
    return g;
  }, []);
  useEffect(() => () => geometriaPunto.dispose(), [geometriaPunto]);

  return (
    <group scale={ESCALA_Q}>
      <group ref={raiz}>
        <mesh position={ARO_CENTRO} material={cromo}>
          <torusGeometry args={[31, 5, 32, 144]} />
        </mesh>
        <group position={COLA_INICIO} rotation={[0, 0, -Math.PI * 0.75]}>
          <mesh position={[0, COLA_LARGO / 2, 0]} material={cromo}>
            <cylinderGeometry args={[5, 5, COLA_LARGO, 32]} />
          </mesh>
        </group>
        <mesh ref={refPunto} geometry={geometriaPunto} position={PUNTO_Q} material={punto} />
      </group>
    </group>
  );
}
