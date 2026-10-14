import React, { useMemo } from "react";
import * as THREE from "three";
import { COLORES } from "../marca";

/**
 * El piso del video: ondas negras mate que la luz rasante dibuja en gris.
 * Reemplaza las dunas de la referencia sin salir de la paleta.
 *
 * El relieve se calcula a partir del segundo que se le pasa (nunca de un
 * reloj de three.js), así cada render sale idéntico.
 */

const LADO = 420;
const DIVISIONES = 180;

/** Ruido barato y determinista: suma de senos con períodos que no encajan. */
function altura(x: number, z: number, segundo: number) {
  const t = segundo * 0.08;
  return (
    Math.sin(x * 0.055 + t) * 2.6 +
    Math.sin(z * 0.041 - t * 0.7) * 2.2 +
    Math.sin((x + z) * 0.027 + t * 0.45) * 3.1 +
    Math.sin((x - z) * 0.019 - t * 0.3) * 2.4
  );
}

export const PisoDeOndas: React.FC<{ segundo: number }> = ({ segundo }) => {
  const geometria = useMemo(() => {
    const g = new THREE.PlaneGeometry(LADO, LADO, DIVISIONES, DIVISIONES);
    const posicion = g.attributes.position;
    for (let i = 0; i < posicion.count; i++) {
      const x = posicion.getX(i);
      const y = posicion.getY(i);
      posicion.setZ(i, altura(x, y, segundo));
    }
    posicion.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [segundo]);

  return (
    <mesh geometry={geometria} rotation={[-Math.PI / 2, 0, 0]} position={[0, -14, 0]} receiveShadow>
      <meshStandardMaterial color={COLORES.negro} roughness={0.95} metalness={0} />
    </mesh>
  );
};
