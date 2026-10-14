"use client";

import dynamic from "next/dynamic";
import { IsotipoQ } from "@/componentes/marca/IsotipoQ";
import { useVista } from "@/estado/vista";

// El 3D se pide recién en el navegador (ssr: false): el texto de la portada
// llega en el HTML del servidor y se lee aunque el 3D nunca cargue.
const EscenaQ = dynamic(() => import("./EscenaQ"), { ssr: false });

/**
 * La Q de la portada según la vista elegida (src/estado/vista.ts): en 3D o
 * en SVG con el degradado del manual. Nunca hay pantalla de "navegador no
 * soportado": sin 3D, la página completa sigue ahí.
 */
export function QCromoDiferido() {
  const vista = useVista();

  if (vista === "decidiendo") return null;

  if (vista === "texto") {
    return (
      <div
        aria-hidden
        className="absolute inset-0 flex items-start justify-center pt-28 md:items-center md:justify-end md:pr-[6%] md:pt-0"
      >
        <IsotipoQ idGradiente="q-portada-svg" className="h-[38svh] w-auto md:h-[56svh]" />
      </div>
    );
  }

  // Un solo lienzo 3D fijo detrás de toda la página (recomendación del
  // estudio): la Q y el punto viajero viven acá y acompañan el scroll.
  // El z negativo lo deja arriba del fondo del body y debajo del contenido.
  return (
    <div aria-hidden className="fixed inset-0 -z-10">
      <EscenaQ />
    </div>
  );
}
