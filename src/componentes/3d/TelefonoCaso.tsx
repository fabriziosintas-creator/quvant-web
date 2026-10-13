"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { obtenerEntornoManual } from "./entornoManual";

/**
 * El teléfono 3D del caso: de frente muestra la propuesta nueva y de
 * espaldas la web vieja. Con el scroll, el teléfono gira media vuelta:
 * arranca mostrando la vieja y termina de frente con la propuesta.
 */

const ANCHO_PANTALLA = 0.96;
const ALTO_PANTALLA = (ANCHO_PANTALLA * 844) / 390;

function Telefono({ srcAntes, srcDespues }: { srcAntes: string; srcDespues: string }) {
  const rig = useRef<THREE.Group>(null);

  const [texturaAntes, texturaDespues] = useTexture([srcAntes, srcDespues], (texturas) => {
    for (const textura of Array.isArray(texturas) ? texturas : [texturas]) {
      textura.colorSpace = THREE.SRGBColorSpace;
      textura.anisotropy = 8;
    }
  });

  const materialCuerpo = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1a1e",
        metalness: 0.7,
        roughness: 0.32,
        envMapIntensity: 0.9,
      }),
    [],
  );

  useFrame((estado3d, delta) => {
    if (!rig.current) return;
    const tiempo = estado3d.clock.elapsedTime;
    // Avance del giro según la posición de la tarjeta en la pantalla.
    const marco = estado3d.gl.domElement.parentElement;
    let progreso = 1;
    if (marco) {
      const caja = marco.getBoundingClientRect();
      const altoVentana = window.innerHeight || 1;
      progreso = THREE.MathUtils.clamp(
        (altoVentana * 0.9 - caja.top) / (altoVentana * 0.95),
        0,
        1,
      );
    }
    const objetivo = Math.PI * (1 - progreso);
    rig.current.rotation.y = THREE.MathUtils.damp(rig.current.rotation.y, objetivo, 3.2, delta);
    rig.current.rotation.z = -0.03;
    rig.current.position.y = Math.sin(tiempo * 0.6) * 0.03;
  });

  return (
    <group ref={rig} rotation={[0, Math.PI, 0]}>
      <RoundedBox args={[1.06, 2.24, 0.09]} radius={0.065} smoothness={6} material={materialCuerpo} />
      {/* Frente: la propuesta nueva. */}
      <mesh position={[0, 0, 0.0465]}>
        <planeGeometry args={[ANCHO_PANTALLA, ALTO_PANTALLA]} />
        <meshBasicMaterial map={texturaDespues} toneMapped={false} />
      </mesh>
      {/* Dorso: la web vieja. */}
      <mesh position={[0, 0, -0.0465]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[ANCHO_PANTALLA, ALTO_PANTALLA]} />
        <meshBasicMaterial map={texturaAntes} toneMapped={false} />
      </mesh>
      <Environment map={obtenerEntornoManual()} />
    </group>
  );
}

export default function TelefonoCaso({
  srcAntes,
  srcDespues,
}: {
  srcAntes: string;
  srcDespues: string;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4.4], fov: 35 }}
      gl={{ alpha: true, antialias: true }}
      style={{ pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <Telefono srcAntes={srcAntes} srcDespues={srcDespues} />
      </Suspense>
    </Canvas>
  );
}
