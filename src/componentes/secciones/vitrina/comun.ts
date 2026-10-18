"use client";

import { useSyncExternalStore } from "react";
import type { Captura } from "@/datos/portfolio";

/** Si una media query se cumple, reactivo (en el servidor, no). */
export function useConsulta(consulta: string) {
  return useSyncExternalStore(
    (aviso) => {
      const lista = window.matchMedia(consulta);
      lista.addEventListener("change", aviso);
      return () => lista.removeEventListener("change", aviso);
    },
    () => window.matchMedia(consulta).matches,
    () => false,
  );
}

export const CONSULTA_ANGOSTA = "(max-width: 767px)";

/** "grimm.com.ar" o "yunque-rust.vercel.app/forja": lo que va en la barra. */
export function direccionCorta(url: string) {
  const { host, pathname } = new URL(url);
  const camino = pathname === "/" ? "" : pathname.split("/").slice(0, 2).join("/");
  return `${host.replace(/^www\./, "")}${camino}`;
}

/** Las capturas largas valen la pena de recorrer; una sola pantalla, no. */
export function esLarga(captura: Captura | undefined) {
  return Boolean(captura && captura.alto / captura.ancho > 1.6);
}

/** Cuánto tarda la vista previa en bajar: más larga la página, más tiempo. */
export function duracionRecorrido(captura: Captura) {
  const pantallas = captura.alto / captura.ancho / 0.625;
  return `${Math.min(14, Math.max(5, pantallas * 1.4)).toFixed(1)}s`;
}

/** Dos dígitos, como el resto de los contadores del sitio. */
export const dosDigitos = (n: number) => String(n).padStart(2, "0");
