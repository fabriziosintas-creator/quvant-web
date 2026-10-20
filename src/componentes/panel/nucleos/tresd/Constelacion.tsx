"use client";

import { Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Escena } from "./Escena";

/**
 * Constelación de núcleos (B.5): cada núcleo es un nodo. Su tamaño es la
 * cantidad de clientes y su brillo la actividad de la semana; los clientes
 * orbitan como puntos cuadrados (la forma del punto del logo). Al pasar el
 * mouse se ve el nombre y los números; al hacer clic la cámara viaja hacia
 * el núcleo y se abre su vista. En blanco y grises sobre negro.
 */
export type NodoNucleo = { id: string; nombre: string; clientes: number; actividad: number; salud: number | null; proximamente: boolean; href: string };

const GRIS = "#9C9CA3";
const BLANCO = "#ECECEE";

function Nodo({ nodo, posicion, activo, alPasar, alTocar }: { nodo: NodoNucleo; posicion: [number, number, number]; activo: boolean; alPasar: (si: boolean) => void; alTocar: () => void }) {
  const grupo = useRef<THREE.Group>(null);
  const orbita = useRef<THREE.Group>(null);
  const radio = nodo.proximamente ? 0.35 : 0.5 + Math.min(1.2, Math.sqrt(nodo.clientes) * 0.3);
  const brillo = nodo.proximamente ? 0.05 : 0.15 + Math.min(1, nodo.actividad) * 0.85;
  const satelites = useMemo(() => Array.from({ length: Math.min(nodo.clientes, 24) }, (_, i) => ({ angulo: (i / Math.max(1, Math.min(nodo.clientes, 24))) * Math.PI * 2, r: radio + 0.7 + (i % 3) * 0.3, y: ((i % 5) - 2) * 0.12 })), [nodo.clientes, radio]);

  useFrame((_, dt) => {
    if (orbita.current) orbita.current.rotation.y += dt * (activo ? 0.35 : 0.12);
    if (grupo.current) grupo.current.scale.setScalar(THREE.MathUtils.lerp(grupo.current.scale.x, activo ? 1.08 : 1, dt * 4));
  });

  return (
    <group position={posicion}>
      <group ref={grupo} onPointerOver={(e) => { e.stopPropagation(); alPasar(true); }} onPointerOut={() => alPasar(false)} onClick={(e) => { e.stopPropagation(); alTocar(); }}>
        <mesh>
          <sphereGeometry args={[radio, 32, 32]} />
          <meshStandardMaterial color={nodo.proximamente ? "#26262B" : BLANCO} emissive={BLANCO} emissiveIntensity={brillo} roughness={0.6} metalness={0.1} wireframe={nodo.proximamente} />
        </mesh>
      </group>
      <group ref={orbita}>
        {satelites.map((s, i) => (
          <mesh key={i} position={[Math.cos(s.angulo) * s.r, s.y, Math.sin(s.angulo) * s.r]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color={activo ? BLANCO : GRIS} />
          </mesh>
        ))}
      </group>
      <Text position={[0, -radio - 0.55, 0]} fontSize={0.26} color={activo ? BLANCO : GRIS} anchorX="center" anchorY="top" font="/fuentes/Michroma-Regular.ttf" letterSpacing={0.12}>
        {nodo.nombre.toUpperCase()}
      </Text>
    </group>
  );
}

function Camara({ objetivo }: { objetivo: THREE.Vector3 | null }) {
  const { camera } = useThree();
  const base = useMemo(() => new THREE.Vector3(0, 6, 14), []);
  useFrame((_, dt) => {
    const destino = objetivo ? objetivo.clone().add(new THREE.Vector3(0, 2.2, 4.5)) : base;
    camera.position.lerp(destino, Math.min(1, dt * 2.2));
    camera.lookAt(objetivo ?? new THREE.Vector3(0, 0, 0));
  });
  return null;
}

function EscenaConstelacion({ nodos, alElegir }: { nodos: NodoNucleo[]; alElegir: (n: NodoNucleo | null) => void }) {
  const router = useRouter();
  const [activo, setActivo] = useState<string | null>(null);
  const [viaje, setViaje] = useState<THREE.Vector3 | null>(null);
  const posiciones = useMemo(() => {
    const activos = nodos.filter((n) => !n.proximamente);
    const proximos = nodos.filter((n) => n.proximamente);
    const pos = new Map<string, [number, number, number]>();
    activos.forEach((n, i) => {
      const a = (i / Math.max(1, activos.length)) * Math.PI * 2 - Math.PI / 2;
      pos.set(n.id, [Math.cos(a) * 4.2, 0, Math.sin(a) * 4.2]);
    });
    proximos.forEach((n, i) => {
      const a = (i / Math.max(1, proximos.length)) * Math.PI * 2 + Math.PI / 6;
      pos.set(n.id, [Math.cos(a) * 7.6, -0.6, Math.sin(a) * 7.6]);
    });
    return pos;
  }, [nodos]);

  return (
    <>
      <Camara objetivo={viaje} />
      <gridHelper args={[26, 26, "#26262B", "#26262B"]} position={[0, -2.2, 0]} />
      {nodos.map((n) => (
        <Nodo
          key={n.id}
          nodo={n}
          posicion={posiciones.get(n.id) ?? [0, 0, 0]}
          activo={activo === n.id}
          alPasar={(si) => {
            setActivo(si ? n.id : null);
            alElegir(si ? n : null);
          }}
          alTocar={() => {
            if (n.proximamente) return;
            setViaje(new THREE.Vector3(...(posiciones.get(n.id) ?? [0, 0, 0])));
            setTimeout(() => router.push(n.href), 700);
          }}
        />
      ))}
    </>
  );
}

export function Constelacion({ nodos, titulo, nota, lista }: { nodos: NodoNucleo[]; titulo: string; nota: string; lista: React.ReactNode }) {
  const [elegido, setElegido] = useState<NodoNucleo | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <Escena titulo={titulo} nota={nota} escena={<EscenaConstelacion nodos={nodos} alElegir={setElegido} />} lista={lista} alto="h-[460px]" />
      <p className="min-h-5 font-plex text-xs text-acero" aria-live="polite">
        {elegido ? (
          <>
            <span className="text-blanco">{elegido.nombre}</span> · {elegido.clientes} clientes · actividad {Math.round(elegido.actividad * 100)} % · salud {elegido.salud ?? "—"}
          </>
        ) : null}
      </p>
    </div>
  );
}
