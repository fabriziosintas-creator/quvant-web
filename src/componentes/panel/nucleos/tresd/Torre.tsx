"use client";

import { Edges, OrbitControls, Text } from "@react-three/drei";
import { useState, type ReactNode } from "react";
import type { SemanaDeUso } from "@/nucleos/tipos";
import { Escena } from "./Escena";

/**
 * Torre de uso (B.5): una columna por módulo y una fila por semana. Cada
 * celda es un bloque cuya altura y brillo siguen la cantidad de acciones:
 * se ve en un golpe de vista qué módulo se apagó.
 */
const BLANCO = "#ECECEE";
const GRIS = "#9C9CA3";

function EscenaTorre({ semanas, modulos, alElegir }: { semanas: SemanaDeUso[]; modulos: string[]; alElegir: (t: string | null) => void }) {
  const maximo = Math.max(1, ...semanas.flatMap((s) => modulos.map((m) => s.accionesPorModulo[m] ?? 0)));
  const paso = 1.1;
  const x0 = -((modulos.length - 1) * paso) / 2;
  const z0 = -((semanas.length - 1) * paso) / 2;
  return (
    <>
      <OrbitControls enablePan={false} minDistance={5} maxDistance={22} maxPolarAngle={Math.PI / 2.1} />
      <gridHelper args={[20, 20, "#26262B", "#26262B"]} />
      {modulos.map((m, i) => (
        <Text key={m} position={[x0 + i * paso, 0.05, z0 - 1]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.22} color={GRIS} anchorX="center" font="/fuentes/IBMPlexMono-Regular.ttf">
          {m.replace(/_/g, " ")}
        </Text>
      ))}
      {semanas.map((s, j) => (
        <Text key={s.inicio} position={[x0 - 1.2, 0.05, z0 + j * paso]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.2} color={GRIS} anchorX="right" font="/fuentes/IBMPlexMono-Regular.ttf">
          {s.inicio.slice(5).split("-").reverse().join("/")}
        </Text>
      ))}
      {semanas.map((s, j) =>
        modulos.map((m, i) => {
          const v = s.accionesPorModulo[m] ?? 0;
          const alto = 0.08 + (v / maximo) * 3;
          const apagado = v === 0;
          return (
            <mesh
              key={`${s.inicio}-${m}`}
              position={[x0 + i * paso, alto / 2, z0 + j * paso]}
              onPointerOver={(e) => { e.stopPropagation(); alElegir(`${m.replace(/_/g, " ")} · semana del ${s.inicio.slice(5).split("-").reverse().join("/")}: ${v} acciones`); }}
              onPointerOut={() => alElegir(null)}
            >
              <boxGeometry args={[0.8, alto, 0.8]} />
              <meshStandardMaterial color={apagado ? "#0D0D0F" : BLANCO} transparent={apagado} opacity={apagado ? 0.1 : 0.25 + 0.75 * (v / maximo)} roughness={0.7} />
              <Edges color={apagado ? "#26262B" : BLANCO} />
            </mesh>
          );
        }),
      )}
    </>
  );
}

export function Torre({ semanas, modulos, titulo, nota, lista }: { semanas: SemanaDeUso[]; modulos: string[]; titulo: string; nota: string; lista: ReactNode }) {
  const [texto, setTexto] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <Escena titulo={titulo} nota={nota} escena={<EscenaTorre semanas={semanas} modulos={modulos} alElegir={setTexto} />} lista={lista} />
      <p className="min-h-5 font-plex text-xs text-acero" aria-live="polite">{texto}</p>
    </div>
  );
}
