import React, { useMemo } from "react";
import * as THREE from "three";
import { COLOR, CROMO, Q, hexVec3 } from "../brand/tokens";
import frag from "../shaders/chrome.frag";
import vert from "../shaders/chrome.vert";

/**
 * La Q cromada en 3D, con la geometría del manual (la misma que la Q del
 * sitio, src/componentes/3d/QCromo.tsx) y el material de chrome.frag.
 *
 * El manual dibuja el isotipo en un lienzo de 105 con Y hacia abajo; cada
 * punto (x, y) pasa a (x − 52,5, 52,5 − y):
 *  - Aro: toro de centro (44, 44), radio 31, trazo 10 (sección de radio 5).
 *  - Cola: de (63, 63) a (80, 80), a 45°, mismo trazo.
 *  - Punto: cuadrado de lado 11 con esquina en (86, 86), con bisel.
 *
 * `armado` deja animar la entrada (aro, cola y por último el punto que
 * encaja) y `adelanto` hace que el punto "se adelante" un paso en diagonal,
 * como en el cierre. Nunca se rota en Z: la cola queda siempre abajo a la
 * derecha.
 */

const aMundo = (x: number, y: number) => new THREE.Vector3(x - Q.lienzo / 2, Q.lienzo / 2 - y, 0);

const RADIO_TRAZO = Q.aro.trazo / 2;
const ARO = aMundo(Q.aro.centro[0], Q.aro.centro[1]);
const COLA_DESDE = aMundo(Q.cola.desde[0], Q.cola.desde[1]);
const COLA_HASTA = aMundo(Q.cola.hasta[0], Q.cola.hasta[1]);
const COLA_LARGO = COLA_DESDE.distanceTo(COLA_HASTA);
const PUNTO = aMundo(Q.punto.esquina[0] + Q.punto.lado / 2, Q.punto.esquina[1] + Q.punto.lado / 2);
/** Un paso del punto: la distancia entre la punta de la cola y el punto, en diagonal. */
const PASO_PUNTO = new THREE.Vector3(1, -1, 0).normalize().multiplyScalar(14);

/** Escala que lleva la Q (~89 unidades del manual) a ~3,5 del mundo, como en el sitio. */
export const ESCALA_Q = 0.034 * 1.15;

export type PropsQChrome = {
  posicion?: [number, number, number];
  /** Solo X e Y: girar en Z rompería la orientación del isotipo. */
  rotacion?: [number, number];
  escala?: number;
  rugosidad?: number;
  softboxAzimut?: number;
  armado?: { aro: number; cola: number; punto: number };
  adelanto?: number;
};

export const QChrome: React.FC<PropsQChrome> = ({
  posicion = [0, 0, 0],
  rotacion = [0, 0],
  escala = ESCALA_Q,
  rugosidad = 0.14,
  softboxAzimut = 0.6,
  armado = { aro: 1, cola: 1, punto: 1 },
  adelanto = 0,
}) => {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uParadas: { value: CROMO.map((hex) => new THREE.Vector3(...hexVec3(hex))) },
          uPlata: { value: new THREE.Vector3(...hexVec3(COLOR.plata)) },
          uTintePlata: { value: 0.35 },
          uRugosidad: { value: rugosidad },
          uIntensidad: { value: 1.3 },
          uSoftbox: { value: 1.6 },
          uSoftboxAzimut: { value: softboxAzimut },
        },
      }),
    [rugosidad, softboxAzimut],
  );

  const geometriaPunto = useMemo(() => {
    const mitad = Q.punto.lado / 2;
    const forma = new THREE.Shape();
    forma.moveTo(-mitad, -mitad);
    forma.lineTo(mitad, -mitad);
    forma.lineTo(mitad, mitad);
    forma.lineTo(-mitad, mitad);
    forma.closePath();
    const geometria = new THREE.ExtrudeGeometry(forma, {
      depth: 7,
      bevelEnabled: true,
      bevelThickness: 1.2,
      bevelSize: 1.2,
      bevelSegments: 5,
    });
    geometria.center();
    return geometria;
  }, []);

  const { aro, cola, punto } = armado;
  const restoPunto = 1 - punto;
  const posicionPunto = PUNTO.clone()
    .add(PASO_PUNTO.clone().multiplyScalar(adelanto))
    .add(new THREE.Vector3(restoPunto * 26, -restoPunto * 26, restoPunto * 30));

  return (
    <group position={posicion} rotation={[rotacion[0], rotacion[1], 0]} scale={escala}>
      {aro > 0 ? (
        <mesh position={ARO} scale={Math.max(0.0001, aro)} rotation={[0, 0, (1 - aro) * -0.9]} material={material}>
          <torusGeometry args={[Q.aro.radio, RADIO_TRAZO, 48, 220]} />
        </mesh>
      ) : null}
      {cola > 0 ? (
        // El grupo nace en el aro y apunta a 45° abajo-derecha; escalar Y la hace crecer.
        <group position={COLA_DESDE} rotation={[0, 0, -Math.PI * 0.75]} scale={[1, Math.max(0.0001, cola), 1]}>
          <mesh position={[0, COLA_LARGO / 2, 0]} material={material}>
            <cylinderGeometry args={[RADIO_TRAZO, RADIO_TRAZO, COLA_LARGO, 48]} />
          </mesh>
        </group>
      ) : null}
      {punto > 0 ? (
        <mesh
          geometry={geometriaPunto}
          position={posicionPunto}
          scale={0.4 + 0.6 * punto}
          material={material}
        />
      ) : null}
    </group>
  );
};
