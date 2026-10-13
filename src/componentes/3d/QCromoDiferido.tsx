"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { IsotipoQ } from "@/componentes/marca/IsotipoQ";

// El 3D se pide recién en el navegador (ssr: false): el texto de la portada
// llega en el HTML del servidor y se lee aunque el 3D nunca cargue.
const EscenaQ = dynamic(() => import("./EscenaQ"), { ssr: false });

type Vista = "decidiendo" | "3d" | "svg";

/**
 * Decide qué versión de la Q mostrar. Es la semilla del futuro interruptor
 * "VISTA 3D / VISTA TEXTO" del estudio de referencia: ya respeta la elección
 * guardada en localStorage, prefers-reduced-motion y la falta de WebGL.
 * Nunca hay pantalla de "navegador no soportado": sin 3D va la Q en SVG
 * con el degradado del manual, y la página completa sigue ahí.
 */
function decidirVista(): Vista {
  let preferencia: string | null = null;
  try {
    preferencia = localStorage.getItem("quvant-vista");
  } catch {
    // Sin localStorage (modo privado, etc.) se decide solo por capacidades.
  }
  if (preferencia === "texto") return "svg";
  if (preferencia !== "3d" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "svg";
  }
  try {
    const lienzo = document.createElement("canvas");
    if (!(lienzo.getContext("webgl2") || lienzo.getContext("webgl"))) return "svg";
  } catch {
    return "svg";
  }
  return "3d";
}

// La decisión se toma una sola vez por pestaña. Cuando exista el interruptor
// VISTA 3D / VISTA TEXTO (fase 8), `suscribir` pasará a escuchar su cambio.
let vistaDecidida: Vista | null = null;
const obtenerVista = (): Vista => {
  if (vistaDecidida === null) vistaDecidida = decidirVista();
  return vistaDecidida;
};
const obtenerVistaEnServidor = (): Vista => "decidiendo";
const suscribir = () => () => {};

export function QCromoDiferido() {
  const vista = useSyncExternalStore(suscribir, obtenerVista, obtenerVistaEnServidor);

  if (vista === "decidiendo") return null;

  if (vista === "svg") {
    return (
      <div
        aria-hidden
        className="absolute inset-0 flex items-start justify-center pt-28 md:items-center md:justify-end md:pr-[6%] md:pt-0"
      >
        <IsotipoQ idGradiente="q-portada-svg" className="h-[38svh] w-auto md:h-[56svh]" />
      </div>
    );
  }

  return <EscenaQ />;
}
