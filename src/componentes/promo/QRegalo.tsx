"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { FiguraQ, PUNTO_Q } from "@/componentes/3d/FiguraQ";
import { obtenerEntornoManual } from "@/componentes/3d/entornoManual";
import { avanceRegalo } from "./avanceRegalo";

/**
 * La Q de cromo que lleva a "lo que te regalamos" (InvitacionRegalo): a
 * medida que se baja, gira, se tiñe de verde y su punto cuadrado se suelta
 * y cae girando hacia los beneficios. El avance del scroll lo escribe la
 * sección en `avanceRegalo` (0 → 1); acá solo se lee en useFrame, sin
 * renders de React por cuadro.
 */

const VERDE = new THREE.Color("#7bd389");
const BLANCO = new THREE.Color("#ffffff");

function Q() {
  const raiz = useRef<THREE.Group>(null);
  const punto = useRef<THREE.Mesh>(null);
  const avance = useRef(0);
  const tinte = useMemo(() => new THREE.Color(), []);
  const cromo = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.15, envMapIntensity: 1.35 }), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7bd389", metalness: 0.5, roughness: 0.2, emissive: "#7bd389", emissiveIntensity: 0.45 }), []);
  useEffect(
    () => () => {
      cromo.dispose();
      material.dispose();
    },
    [cromo, material],
  );

  useFrame((estado, delta) => {
    const g = raiz.current;
    const p = punto.current;
    if (!g || !p) return;
    // El avance se suaviza: aunque el scroll vaya a saltos, la Q se mueve parejo.
    avance.current = THREE.MathUtils.damp(avance.current, avanceRegalo.valor, 4, delta);
    const a = avance.current;
    const t = estado.clock.elapsedTime;
    g.rotation.y = a * Math.PI * 2.2 + Math.sin(t * 0.5) * 0.18;
    g.rotation.x = Math.sin(t * 0.7) * 0.06 - a * 0.25;
    g.position.y = Math.sin(t * 0.9) * 2;
    tinte.copy(BLANCO).lerp(VERDE, 0.1 + a * 0.3);
    cromo.color.lerp(tinte, 1 - Math.exp(-delta * 4));
    // El punto se suelta en la segunda mitad y cae hacia los beneficios, girando.
    const caida = THREE.MathUtils.smoothstep(a, 0.35, 1);
    p.position.set(PUNTO_Q.x - caida * 22, PUNTO_Q.y - caida * caida * 95, PUNTO_Q.z + caida * 12);
    p.rotation.set(caida * Math.PI * 1.5, caida * Math.PI, caida * Math.PI * 2);
    material.setValues({ emissiveIntensity: 0.45 + caida * 0.9 });
  });

  return <FiguraQ cromo={cromo} punto={material} raiz={raiz} refPunto={punto} />;
}

export default function QRegalo({ activo }: { activo: boolean }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, -0.6, 8.2], fov: 38 }} frameloop={activo ? "always" : "never"} gl={{ antialias: true, alpha: true }}>
      <Environment map={obtenerEntornoManual()} />
      <Q />
    </Canvas>
  );
}
