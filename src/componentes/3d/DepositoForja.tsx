"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { obtenerEntornoManual } from "./entornoManual";

/**
 * El mini-depósito de Forja: estanterías low-poly dibujadas como líneas
 * finas en gris acero sobre negro (el "3D técnico y sobrio" del estudio),
 * con un solo producto resaltado en el cromo de la marca. Se recorre con
 * el mouse y deriva sola cuando nadie lo mueve.
 */

const ACERO = "#9c9ca3";
const PROFUNDO = "#26262b";

/** Caja dibujada solo por sus aristas. */
function CajaLineas({
  medidas,
  posicion,
  color = ACERO,
  opacidad = 0.65,
}: {
  medidas: [number, number, number];
  posicion: [number, number, number];
  color?: string;
  opacidad?: number;
}) {
  const geometria = useMemo(() => {
    const caja = new THREE.BoxGeometry(...medidas);
    const bordes = new THREE.EdgesGeometry(caja);
    caja.dispose();
    return bordes;
  }, [medidas]);

  return (
    <lineSegments geometry={geometria} position={posicion}>
      <lineBasicMaterial color={color} transparent opacity={opacidad} />
    </lineSegments>
  );
}

/** Una estantería: cuatro parantes y tres estantes. */
function Estanteria({ x }: { x: number }) {
  const ANCHO = 2.2;
  const ALTO = 1.9;
  const PROF = 0.8;
  const mitadA = ANCHO / 2 - 0.03;
  const mitadP = PROF / 2 - 0.03;
  return (
    <group position={[x, 0, 0]}>
      {[-mitadA, mitadA].map((px) =>
        [-mitadP, mitadP].map((pz) => (
          <CajaLineas
            key={`${px}-${pz}`}
            medidas={[0.05, ALTO, 0.05]}
            posicion={[px, ALTO / 2, pz]}
          />
        )),
      )}
      {[0.35, 0.95, 1.55].map((py) => (
        <CajaLineas key={py} medidas={[ANCHO, 0.04, PROF]} posicion={[0, py, 0]} />
      ))}
    </group>
  );
}

/** Cajas apiladas en los estantes (posiciones fijas, aspecto casual). */
const CAJITAS: Array<[number, number, number]> = [
  [-2.9, 0.53, 0.12],
  [-2.35, 0.53, -0.18],
  [-2.6, 1.13, 0.05],
  [0.55, 0.53, -0.1],
  [-0.5, 1.13, 0.18],
  [0.3, 1.73, 0],
  [2.25, 0.53, 0.15],
  [2.8, 1.13, -0.12],
  [2.45, 1.73, 0.08],
];

function Escena() {
  const rig = useRef<THREE.Group>(null);
  const puntero = useRef({ x: 0, y: 0, ultimoMovimiento: 0 });

  useEffect(() => {
    const alMover = (evento: PointerEvent) => {
      puntero.current.x = (evento.clientX / window.innerWidth) * 2 - 1;
      puntero.current.y = (evento.clientY / window.innerHeight) * 2 - 1;
      puntero.current.ultimoMovimiento = performance.now();
    };
    window.addEventListener("pointermove", alMover, { passive: true });
    return () => window.removeEventListener("pointermove", alMover);
  }, []);

  const materialCromo = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 1,
        roughness: 0.08,
        envMapIntensity: 1.2,
      }),
    [],
  );

  useFrame((estado3d, delta) => {
    if (!rig.current) return;
    const tiempo = estado3d.clock.elapsedTime;
    const inactivo = performance.now() - puntero.current.ultimoMovimiento > 3000;
    const objetivoY = inactivo
      ? Math.sin(tiempo * 0.18) * 0.28
      : -0.1 + puntero.current.x * 0.35;
    const objetivoX = inactivo ? 0 : puntero.current.y * 0.06;
    rig.current.rotation.y = THREE.MathUtils.damp(rig.current.rotation.y, objetivoY, 2.5, delta);
    rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, objetivoX, 2.5, delta);
  });

  return (
    <group ref={rig} position={[0, -0.85, 0]}>
      <gridHelper args={[9, 18, PROFUNDO, PROFUNDO]} />
      <Estanteria x={-2.6} />
      <Estanteria x={0} />
      <Estanteria x={2.6} />
      {CAJITAS.map((posicion) => (
        <CajaLineas
          key={posicion.join(",")}
          medidas={[0.34, 0.34, 0.34]}
          posicion={posicion}
          opacidad={0.45}
        />
      ))}
      {/* El producto resaltado: la única pieza maciza, en cromo. */}
      <mesh position={[-0.45, 0.56, 0]} material={materialCromo}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
      </mesh>
      <Environment map={obtenerEntornoManual()} />
    </group>
  );
}

export default function DepositoForja() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [3.2, 1.7, 5], fov: 33 }}
      gl={{ alpha: true, antialias: true }}
      style={{ pointerEvents: "none" }}
      onCreated={({ camera }) => camera.lookAt(0, 0.1, 0)}
    >
      <Escena />
    </Canvas>
  );
}
