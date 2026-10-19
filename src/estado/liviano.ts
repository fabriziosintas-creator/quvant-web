"use client";

import { useSyncExternalStore } from "react";

const nada = () => () => {};

/**
 * Si el sitio va en modo liviano: lo decide el script del <head>
 * (introDecision.ts) antes de pintar, para celulares muy modestos o con
 * ahorro de datos, y lo deja en <html data-liviano="si">. En el servidor, no.
 */
export function useLiviano() {
  return useSyncExternalStore(
    nada,
    () => document.documentElement.dataset.liviano === "si",
    () => false,
  );
}
