"use client";

import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";

/**
 * El <Canvas> único de cada pantalla de Núcleos: sin sombras, píxeles
 * limitados (1,5) para el celular, fondo negro de la marca y luz suave.
 */
export function Lienzo({ children }: { children: ReactNode }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 6, 14], fov: 40 }} gl={{ antialias: true, powerPreference: "low-power" }} shadows={false}>
      <color attach="background" args={["#0D0D0F"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 8]} intensity={1.1} />
      <directionalLight position={[-6, 4, -6]} intensity={0.35} />
      {children}
    </Canvas>
  );
}
