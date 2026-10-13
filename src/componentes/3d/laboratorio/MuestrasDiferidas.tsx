"use client";

import dynamic from "next/dynamic";

// Igual que la portada: el 3D se pide recién en el navegador.
const GrillaMuestras = dynamic(() => import("./GrillaMuestras"), { ssr: false });

export function MuestrasDiferidas() {
  return <GrillaMuestras />;
}
