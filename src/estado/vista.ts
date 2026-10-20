"use client";

import { useSyncExternalStore } from "react";

/**
 * Vista única del sitio (estudio de referencia, 9.3): "3d" o "texto".
 * "texto" apaga todos los lienzos 3D, el scroll suave y las animaciones
 * grandes; la Q se muestra en SVG con el degradado del manual.
 *
 * Ya no se elige a mano (el interruptor 3D / texto se sacó el 20-oct-2026):
 * la decide el navegador al cargar.
 *  1. prefers-reduced-motion → texto.
 *  2. Sin WebGL → texto.
 * En el servidor la vista es "decidiendo" y no se dibuja ninguna variante.
 */

export type Vista = "3d" | "texto";
export type VistaSnapshot = Vista | "decidiendo";

let vistaActual: Vista | null = null;
let webglDecidido: boolean | null = null;

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
  try {
    // La elección que dejó el interruptor viejo ya no cuenta: se borra.
    localStorage.removeItem("quvant-vista");
  } catch {
    // Sin localStorage (modo privado, etc.) no hay nada que borrar.
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "texto";
  return hayWebGL() ? "3d" : "texto";
}

/** El CSS también necesita saberlo (cinta, cursor): va en <html data-vista>. */
function reflejarEnDocumento(vista: Vista) {
  document.documentElement.dataset.vista = vista;
}

export function obtenerVista(): VistaSnapshot {
  if (vistaActual === null) {
    vistaActual = decidirVistaInicial();
    reflejarEnDocumento(vistaActual);
  }
  return vistaActual;
}

export const obtenerVistaEnServidor = (): VistaSnapshot => "decidiendo";

/** La vista no cambia después de decidirse: no hay nada que escuchar. */
const suscribirVista = () => () => {};

/** La vista actual, reactiva: "decidiendo" en el servidor, "3d"/"texto" en el navegador. */
export function useVista(): VistaSnapshot {
  return useSyncExternalStore(suscribirVista, obtenerVista, obtenerVistaEnServidor);
}
