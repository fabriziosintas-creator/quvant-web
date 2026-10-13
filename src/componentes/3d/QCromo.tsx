"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * La Q de cromo en 3D real, con la geometría del manual de identidad.
 *
 * El manual define el isotipo en un lienzo de 105 × 105 con el eje Y hacia
 * abajo; acá cada punto (x, y) pasa a coordenadas centradas de three.js con
 * (x − 52.5, 52.5 − y):
 *  - Aro: toro de centro (44, 44) y radio 31, sección redonda de radio 5
 *    (trazo 10) para que el cromo tenga curvas que reflejen.
 *  - Cola: cilindro a 45° de (63, 63) a (80, 80), radio 5.
 *  - Punto: cuadrado de lado 11 con esquina en (86, 86), extruido con bisel.
 */

const ARO_CENTRO = new THREE.Vector3(-8.5, 8.5, 0);
const ARO_RADIO = 31;
const TRAZO_RADIO = 5;
const COLA_INICIO = new THREE.Vector3(10.5, -10.5, 0);
const COLA_LARGO = Math.hypot(17, 17);
const PUNTO_CENTRO = new THREE.Vector3(39, -39, 0);
const PUNTO_LADO = 11;

/** La figura mide ~89 unidades del manual; esta escala la lleva a ~3 del mundo 3D. */
const ESCALA_GLOBAL = 0.034;

/** Duración total del armado (aro → cola → punto que encaja). El brief exige < 2 s. */
const DURACION_ARMADO = 1.55;

/** A los 3 s sin mover el puntero (o en pantallas táctiles), la Q gira sola despacio. */
const PUNTERO_INACTIVO_MS = 3000;

const facilAfuera = (t: number) => 1 - Math.pow(1 - t, 3);
const facilRebote = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const tramo = (p: number, desde: number, hasta: number) =>
  THREE.MathUtils.clamp((p - desde) / (hasta - desde), 0, 1);

type Props = {
  /** Con false, la Q aparece ya armada (sin animación de entrada). */
  animarEntrada?: boolean;
  /** Avisa el avance del armado de 0 a 100, para el contador estilo terminal. */
  alProgresar?: (porcentaje: number) => void;
};

export function QCromo({ animarEntrada = true, alProgresar }: Props) {
  const raiz = useRef<THREE.Group>(null);
  const flote = useRef<THREE.Group>(null);
  const aro = useRef<THREE.Mesh>(null);
  const cola = useRef<THREE.Group>(null);
  const punto = useRef<THREE.Mesh>(null);

  const puntero = useRef({ x: 0, y: 0, ultimoMovimiento: 0 });
  const armado = useRef({ progreso: animarEntrada ? 0 : 1, ultimoEmitido: -1 });

  // El lienzo no recibe eventos (pointer-events: none) para no tapar los botones,
  // así que el puntero se escucha en window.
  useEffect(() => {
    const alMover = (evento: PointerEvent) => {
      puntero.current.x = (evento.clientX / window.innerWidth) * 2 - 1;
      puntero.current.y = (evento.clientY / window.innerHeight) * 2 - 1;
      puntero.current.ultimoMovimiento = performance.now();
    };
    window.addEventListener("pointermove", alMover, { passive: true });
    return () => window.removeEventListener("pointermove", alMover);
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 1,
        roughness: 0.05,
        envMapIntensity: 1.45,
      }),
    [],
  );

  const geometriaPunto = useMemo(() => {
    const mitad = PUNTO_LADO / 2;
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
      bevelSegments: 4,
    });
    geometria.center();
    return geometria;
  }, []);

  // La Q se acomoda sola al ancho visible: a la derecha en escritorio,
  // arriba y centrada en el celular.
  const { viewport } = useThree();
  const compacto = viewport.width < 6.2;
  const escala = ESCALA_GLOBAL * (compacto ? Math.max(0.6, viewport.width / 6.2) : 1.15);
  const posicion: [number, number, number] = compacto ? [0, 1.15, 0] : [1.8, 0.1, 0];

  useFrame((estado3d, delta) => {
    const tiempo = estado3d.clock.elapsedTime;

    // 1) Armado: aro, cola y, por último, el punto que encaja.
    if (armado.current.progreso < 1) {
      armado.current.progreso = Math.min(1, armado.current.progreso + delta / DURACION_ARMADO);
      const p = armado.current.progreso;
      const pAro = facilAfuera(tramo(p, 0, 0.45));
      const pCola = facilAfuera(tramo(p, 0.3, 0.68));
      const pPunto = facilRebote(tramo(p, 0.6, 1));

      if (aro.current) {
        aro.current.scale.setScalar(Math.max(0.0001, pAro));
        aro.current.rotation.z = (1 - pAro) * -0.9;
      }
      if (cola.current) {
        cola.current.scale.y = Math.max(0.0001, pCola);
      }
      if (punto.current) {
        punto.current.visible = p >= 0.6;
        const resto = 1 - pPunto;
        punto.current.position.set(
          PUNTO_CENTRO.x + resto * 26,
          PUNTO_CENTRO.y - resto * 26,
          resto * 30,
        );
        punto.current.scale.setScalar(0.4 + 0.6 * pPunto);
      }

      const porcentaje = Math.round(p * 100);
      if (porcentaje !== armado.current.ultimoEmitido) {
        armado.current.ultimoEmitido = porcentaje;
        alProgresar?.(porcentaje);
      }
    }

    // 2) Rotación hacia el puntero con inercia; sin puntero, deriva lenta.
    const inactivo = performance.now() - puntero.current.ultimoMovimiento > PUNTERO_INACTIVO_MS;
    const objetivoY = inactivo ? Math.sin(tiempo * 0.25) * 0.35 : puntero.current.x * 0.5;
    const objetivoX = inactivo ? Math.sin(tiempo * 0.17) * 0.12 : puntero.current.y * 0.3;
    if (raiz.current) {
      raiz.current.rotation.y = THREE.MathUtils.damp(raiz.current.rotation.y, objetivoY, 3, delta);
      raiz.current.rotation.x = THREE.MathUtils.damp(raiz.current.rotation.x, objetivoX, 3, delta);
    }

    // 3) Flote suave, siempre.
    if (flote.current) {
      flote.current.position.y = Math.sin(tiempo * 0.7) * 1.6;
    }
  });

  return (
    <group position={posicion} scale={escala}>
      <group ref={raiz}>
        <group ref={flote}>
          <mesh ref={aro} position={ARO_CENTRO} material={material}>
            <torusGeometry args={[ARO_RADIO, TRAZO_RADIO, 32, 144]} />
          </mesh>
          {/* El grupo nace en el borde del aro y apunta a 45° abajo-derecha;
              escalar su eje Y hace crecer la cola desde el aro hacia afuera. */}
          <group ref={cola} position={COLA_INICIO} rotation={[0, 0, -Math.PI * 0.75]}>
            <mesh position={[0, COLA_LARGO / 2, 0]} material={material}>
              <cylinderGeometry args={[TRAZO_RADIO, TRAZO_RADIO, COLA_LARGO, 32]} />
            </mesh>
          </group>
          <mesh ref={punto} geometry={geometriaPunto} position={PUNTO_CENTRO} material={material} />
        </group>
      </group>
    </group>
  );
}
