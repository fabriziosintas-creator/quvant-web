"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { FiguraQ } from "@/componentes/3d/FiguraQ";
import { obtenerEntornoManual } from "@/componentes/3d/entornoManual";

/**
 * La Q de cromo del registro (FiguraQ, con el entorno del manual): flota,
 * sigue al mouse, se tiñe con el color del rubro elegido, da una vuelta en
 * cada paso y dos al terminar. Todo el movimiento va en useFrame, sin
 * renders de React. Solo se arma en computadora y en vista 3D
 * (FichaRegistro).
 */

const BLANCO = new THREE.Color("#ffffff");
const puntero = { x: 0, y: 0 };

function Q({ acento, paso, celebrar }: { acento: string; paso: number; celebrar: boolean }) {
  const raiz = useRef<THREE.Group>(null);
  const destino = useRef(new THREE.Color(acento));
  const giroDestino = useRef(0);
  const giro = useRef(0);
  const pulso = useRef(0);
  const mirada = useRef({ x: 0, y: 0 });
  const tinte = useMemo(() => new THREE.Color(), []);

  const cromo = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.16, envMapIntensity: 1.3 }), []);
  // Arranca gris y va hacia el color del rubro en useFrame (así no depende de `acento` al crearse).
  const punto = useMemo(() => new THREE.MeshStandardMaterial({ color: "#9c9ca3", metalness: 0.55, roughness: 0.22, emissive: "#9c9ca3", emissiveIntensity: 0.4 }), []);

  useEffect(() => {
    destino.current.set(acento);
  }, [acento]);
  // Una vuelta por paso; al terminar, dos y un latido.
  useEffect(() => {
    if (paso > 0) giroDestino.current += Math.PI * 2;
  }, [paso]);
  useEffect(() => {
    if (!celebrar) return;
    giroDestino.current += Math.PI * 4;
    pulso.current = 1;
  }, [celebrar]);
  useEffect(
    () => () => {
      cromo.dispose();
      punto.dispose();
    },
    [cromo, punto],
  );

  useFrame((estado, delta) => {
    const g = raiz.current;
    if (!g) return;
    const suavizar = 1 - Math.exp(-delta * 3);
    // El cromo refleja un poco del color del rubro; el punto cuadrado, todo.
    tinte.copy(BLANCO).lerp(destino.current, 0.34);
    cromo.color.lerp(tinte, suavizar);
    punto.color.lerp(destino.current, suavizar);
    punto.emissive.lerp(destino.current, suavizar);
    giro.current = THREE.MathUtils.damp(giro.current, giroDestino.current, 2.4, delta);
    pulso.current = THREE.MathUtils.damp(pulso.current, 0, 2.2, delta);
    mirada.current.x = THREE.MathUtils.damp(mirada.current.x, puntero.x * 0.55, 3, delta);
    mirada.current.y = THREE.MathUtils.damp(mirada.current.y, puntero.y * 0.3, 3, delta);
    const t = estado.clock.elapsedTime;
    g.rotation.y = giro.current + mirada.current.x;
    g.rotation.x = mirada.current.y + Math.sin(t * 0.6) * 0.04;
    g.position.y = Math.sin(t * 0.8) * 0.08 / 0.042;
    g.scale.setScalar(1 + pulso.current * 0.12);
  });

  return <FiguraQ cromo={cromo} punto={punto} raiz={raiz} />;
}

export default function QRegistro({ acento, paso, celebrar, activo }: { acento: string; paso: number; celebrar: boolean; activo: boolean }) {
  useEffect(() => {
    const alMover = (evento: PointerEvent) => {
      puntero.x = (evento.clientX / window.innerWidth) * 2 - 1;
      puntero.y = (evento.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", alMover, { passive: true });
    return () => window.removeEventListener("pointermove", alMover);
  }, []);

  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 7.4], fov: 35 }} frameloop={activo ? "always" : "never"} gl={{ antialias: true, alpha: true }}>
      <Environment map={obtenerEntornoManual()} />
      <Q acento={acento} paso={paso} celebrar={celebrar} />
    </Canvas>
  );
}
