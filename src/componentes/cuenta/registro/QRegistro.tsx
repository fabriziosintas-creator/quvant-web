"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { obtenerEntornoManual } from "@/componentes/3d/entornoManual";

/**
 * La Q de cromo del registro (la misma geometría y el mismo entorno que
 * la Q de la portada, ver 3d/laboratorio): flota, sigue al mouse, se tiñe
 * con el color del rubro elegido, da una vuelta en cada paso y dos al
 * terminar. Todo el movimiento va en useFrame, sin renders de React.
 * Solo se arma en computadora y en vista 3D (FichaRegistro).
 */

const ARO_CENTRO = new THREE.Vector3(-8.5, 8.5, 0);
const COLA_INICIO = new THREE.Vector3(10.5, -10.5, 0);
const COLA_LARGO = Math.hypot(17, 17);
const PUNTO_CENTRO = new THREE.Vector3(39, -39, 0);
const ESCALA = 0.042;
const BLANCO = new THREE.Color("#ffffff");

const puntero = { x: 0, y: 0 };

function Q({ acento, paso, celebrar }: { acento: string; paso: number; celebrar: boolean }) {
  const raiz = useRef<THREE.Group>(null);
  const destino = useRef(new THREE.Color(acento));
  const giroDestino = useRef(0);
  const giro = useRef(0);
  const pulso = useRef(0);
  const tinte = useMemo(() => new THREE.Color(), []);

  const cromo = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.16, envMapIntensity: 1.3 }), []);
  // Arranca gris y va hacia el color del rubro en useFrame (así no depende de `acento` al crearse).
  const punto = useMemo(() => new THREE.MeshStandardMaterial({ color: "#9c9ca3", metalness: 0.55, roughness: 0.22, emissive: "#9c9ca3", emissiveIntensity: 0.4 }), []);
  const mirada = useRef({ x: 0, y: 0 });

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
      geometriaPunto.dispose();
    },
    [cromo, punto, geometriaPunto],
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
    g.position.y = Math.sin(t * 0.8) * 0.08;
    g.scale.setScalar(1 + pulso.current * 0.12);
  });

  return (
    <group scale={ESCALA}>
      <group ref={raiz}>
        <mesh position={ARO_CENTRO} material={cromo}>
          <torusGeometry args={[31, 5, 32, 144]} />
        </mesh>
        <group position={COLA_INICIO} rotation={[0, 0, -Math.PI * 0.75]}>
          <mesh position={[0, COLA_LARGO / 2, 0]} material={cromo}>
            <cylinderGeometry args={[5, 5, COLA_LARGO, 32]} />
          </mesh>
        </group>
        <mesh geometry={geometriaPunto} position={PUNTO_CENTRO} material={punto} />
      </group>
    </group>
  );
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
