"use client";

import { Edges, OrbitControls, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { Semaforo } from "@/nucleos/tipos";
import { Escena } from "./Escena";

/**
 * Ciudad de clientes (B.5): cada cliente es un volumen sobre una grilla.
 * La altura es la actividad, el ancho la cantidad de sucursales y el
 * acabado la salud, con la misma regla que el semáforo del panel:
 * verde lleno, amarillo con borde, rojo vacío (solo aristas), arranque
 * chico y gris. Se gira, se acerca y se ordena por la métrica elegida con
 * transición animada entre órdenes.
 */
export type EdificioCliente = { id: string; nombre: string; actividad: number; sucursales: number; semaforo: Semaforo; href: string };

const BLANCO = "#ECECEE";
const GRIS = "#9C9CA3";

function Edificio({ e, destino, maximo, alPasar, alTocar }: { e: EdificioCliente; destino: [number, number]; maximo: number; alPasar: (si: boolean) => void; alTocar: () => void }) {
  const grupo = useRef<THREE.Group>(null);
  const alto = 0.3 + (e.actividad / Math.max(1, maximo)) * 4;
  const ancho = 0.5 + Math.min(4, e.sucursales) * 0.22;
  useFrame((_, dt) => {
    if (!grupo.current) return;
    grupo.current.position.x = THREE.MathUtils.lerp(grupo.current.position.x, destino[0], Math.min(1, dt * 3));
    grupo.current.position.z = THREE.MathUtils.lerp(grupo.current.position.z, destino[1], Math.min(1, dt * 3));
  });
  const lleno = e.semaforo === "verde";
  const transparente = e.semaforo !== "verde";
  return (
    <group ref={grupo} position={[destino[0], 0, destino[1]]} onPointerOver={(ev) => { ev.stopPropagation(); alPasar(true); }} onPointerOut={() => alPasar(false)} onClick={(ev) => { ev.stopPropagation(); alTocar(); }}>
      <mesh position={[0, alto / 2, 0]}>
        <boxGeometry args={[ancho, alto, ancho]} />
        <meshStandardMaterial color={lleno ? BLANCO : e.semaforo === "arranque" ? "#26262B" : "#0D0D0F"} transparent={transparente} opacity={lleno ? 1 : e.semaforo === "amarillo" ? 0.35 : 0.08} roughness={0.7} />
        <Edges color={e.semaforo === "rojo" ? GRIS : BLANCO} threshold={15} />
      </mesh>
      <Text position={[0, alto + 0.35, 0]} fontSize={0.2} color={GRIS} anchorX="center" font="/fuentes/IBMPlexMono-Regular.ttf" maxWidth={2.4} textAlign="center">
        {e.nombre.replace(" (ejemplo)", "")}
      </Text>
    </group>
  );
}

function EscenaCiudad({ edificios, alElegir }: { edificios: EdificioCliente[]; alElegir: (e: EdificioCliente | null) => void }) {
  const router = useRouter();
  const maximo = Math.max(1, ...edificios.map((e) => e.actividad));
  const columnas = Math.max(1, Math.ceil(Math.sqrt(edificios.length)));
  const destinos = useMemo(() => {
    const m = new Map<string, [number, number]>();
    edificios.forEach((e, i) => m.set(e.id, [(i % columnas) * 2.2 - ((columnas - 1) * 2.2) / 2, Math.floor(i / columnas) * 2.2 - ((Math.ceil(edificios.length / columnas) - 1) * 2.2) / 2]));
    return m;
  }, [edificios, columnas]);
  return (
    <>
      <OrbitControls enablePan={false} minDistance={6} maxDistance={24} maxPolarAngle={Math.PI / 2.1} />
      <gridHelper args={[24, 24, "#26262B", "#26262B"]} />
      {edificios.map((e) => (
        <Edificio key={e.id} e={e} destino={destinos.get(e.id) ?? [0, 0]} maximo={maximo} alPasar={(si) => alElegir(si ? e : null)} alTocar={() => router.push(e.href)} />
      ))}
    </>
  );
}

export function Ciudad({ edificios, titulo, nota, lista }: { edificios: EdificioCliente[]; titulo: string; nota: string; lista: ReactNode }) {
  const [elegido, setElegido] = useState<EdificioCliente | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <Escena titulo={titulo} nota={nota} escena={<EscenaCiudad edificios={edificios} alElegir={setElegido} />} lista={lista} />
      <p className="min-h-5 font-plex text-xs text-acero" aria-live="polite">
        {elegido ? (
          <>
            <span className="text-blanco">{elegido.nombre}</span> · {elegido.actividad} acciones · {elegido.sucursales} sucursales · {elegido.semaforo}
          </>
        ) : null}
      </p>
    </div>
  );
}
