"use client";

import { useSyncExternalStore } from "react";

/**
 * Vista única del sitio (estudio de referencia, 9.3): "3d" o "texto".
 * "texto" apaga todos los lienzos 3D, el scroll suave y las animaciones
 * grandes; la Q se muestra en SVG con el degradado del manual.
 *
 * La decisión inicial, en orden:
 *  1. La elección guardada en localStorage ("quvant-vista").
 *  2. prefers-reduced-motion → texto.
 *  3. Sin WebGL → texto (y el interruptor ni se ofrece).
 * En el servidor la vista es "decidiendo" y no se dibuja ninguna variante.
 */

export type Vista = "3d" | "texto";
export type VistaSnapshot = Vista | "decidiendo";

let vistaActual: Vista | null = null;
let webglDecidido: boolean | null = null;
const oyentes = new Set<() => void>();

export function hayWebGL(): boolean {
  if (webglDecidido === null) {
    try {
      const lienzo = document.createElement("canvas");
      webglDecidido = Boolean(lienzo.getContext("webgl2") || lienzo.getContext("webgl"));
    } catch {
      webglDecidido = false;
    }
  }
  return webglDecidido;
}

function decidirVistaInicial(): Vista {
  let guardada: string | null = null;
  try {
    guardada = localStorage.getItem("quvant-vista");
  } catch {
    // Sin localStorage (modo privado, etc.) se decide solo por capacidades.
  }
  if (guardada === "texto") return "texto";
  if (guardada !== "3d" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "texto";
  }
  return hayWebGL() ? "3d" : "texto";
}

export function obtenerVista(): VistaSnapshot {
  if (vistaActual === null) vistaActual = decidirVistaInicial();
  return vistaActual;
}

export const obtenerVistaEnServidor = (): VistaSnapshot => "decidiendo";

export function fijarVista(vista: Vista) {
  if (vista === "3d" && !hayWebGL()) return;
  if (vista === vistaActual) return;
  vistaActual = vista;
  try {
    localStorage.setItem("quvant-vista", vista);
  } catch {
    // Si no se puede guardar, la elección vale igual durante esta pestaña.
  }
  for (const avisar of oyentes) avisar();
}

export function suscribirVista(avisar: () => void) {
  oyentes.add(avisar);
  return () => {
    oyentes.delete(avisar);
  };
}

/** La vista actual, reactiva: "decidiendo" en el servidor, "3d"/"texto" en el navegador. */
export function useVista(): VistaSnapshot {
  return useSyncExternalStore(suscribirVista, obtenerVista, obtenerVistaEnServidor);
}
