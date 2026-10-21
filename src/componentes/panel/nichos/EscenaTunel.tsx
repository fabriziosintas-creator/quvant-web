"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * El túnel para entrar a un nicho: anillos cuadrados de puntos (la grilla
 * de la marca, en 3D) que pasan hacia la cámara mientras al fondo se abre
 * el portal del color del nicho. Un solo Canvas, sin sombras, dpr hasta
 * 1,5. Mientras carga la página: cuando llegan los datos, se desmonta solo.
 *
 * WebGL (el renderer estándar de R3F). El WebGPURenderer de three todavía
 * pide materiales de nodos y dos copias de three conviven mal con drei:
 * queda para cuando R3F lo soporte sin vueltas.
 */

const ANILLOS = 34;
const LADO = 2.6;
const PUNTOS_POR_LADO = 14;
const FONDO = -46;

function Anillos({ color }: { color: string }) {
  const grupo = useRef<THREE.Group>(null);
  const velocidad = useRef(26);
  // Un anillo: el contorno de un cuadrado hecho de puntos.
  const geometria = useMemo(() => {
    const pos: number[] = [];
    for (let i = 0; i < PUNTOS_POR_LADO; i++) {
      const t = -LADO + (2 * LADO * i) / PUNTOS_POR_LADO;
      pos.push(t, -LADO, 0, LADO, t, 0, -t, LADO, 0, -LADO, -t, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);
  const material = useMemo(() => new THREE.PointsMaterial({ color, size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.9 }), [color]);

  useFrame((_, dt) => {
    const g = grupo.current;
    if (!g) return;
    // Arranca rápido y frena: la sensación de "llegar".
    velocidad.current = Math.max(5, velocidad.current * (1 - Math.min(0.9, dt * 0.9)));
    for (const anillo of g.children) {
      anillo.position.z += velocidad.current * dt;
      anillo.rotation.z += dt * 0.08;
      if (anillo.position.z > 5) anillo.position.z += FONDO - 5;
    }
  });

  return (
    <group ref={grupo}>
      {Array.from({ length: ANILLOS }, (_, i) => (
        <points key={i} geometry={geometria} material={material} position={[0, 0, FONDO + (i * (5 - FONDO)) / ANILLOS]} rotation={[0, 0, (i * Math.PI) / 36]} />
      ))}
    </group>
  );
}

/** El portal del fondo: el cuadradito de la marca, del color del nicho, que crece. */
function Portal({ color }: { color: string }) {
  const malla = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = malla.current;
    if (!m) return;
    const s = 0.6 + Math.min(1, clock.elapsedTime / 1.6) * 1.6;
    m.scale.setScalar(s);
  });
  return (
    <mesh ref={malla} position={[0, 0, FONDO + 2]}>
      <planeGeometry args={[1.4, 1.4]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} />
    </mesh>
  );
}

export default function EscenaTunel({ color }: { color: string }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 62, near: 0.1, far: 80 }} gl={{ antialias: false, powerPreference: "high-performance" }} aria-hidden>
      <color attach="background" args={["#0D0D0F"]} />
      <fog attach="fog" args={["#0D0D0F", 6, 44]} />
      <Anillos color={color} />
      <Portal color={color} />
    </Canvas>
  );
}
