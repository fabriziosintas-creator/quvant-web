"use client";

import { useSyncExternalStore } from "react";

const CONSULTA_QUIETO = "(prefers-reduced-motion: reduce)";

function suscribirQuieto(aviso: () => void) {
  const consulta = window.matchMedia(CONSULTA_QUIETO);
  consulta.addEventListener("change", aviso);
  return () => consulta.removeEventListener("change", aviso);
}

/** Si la persona pidió menos movimiento en su sistema (en el servidor, no). */
export function usePrefiereQuieto() {
  return useSyncExternalStore(
    suscribirQuieto,
    () => window.matchMedia(CONSULTA_QUIETO).matches,
    () => false,
  );
}
