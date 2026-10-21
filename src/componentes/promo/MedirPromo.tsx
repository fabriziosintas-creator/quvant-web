"use client";

import { useEffect } from "react";
import { medir } from "@/componentes/medicion/medir";

/** Anota que alguien entró a la página de "Primeros 100" (medición propia, sin terceros). */
export function MedirPromo() {
  useEffect(() => {
    medir("vista_promo");
  }, []);
  return null;
}

/** Las demostraciones ya anotadas en esta carga (cuenta la primera vez que se usa cada una). */
const usadas = new Set<string>();

export function usoDemo(id: string) {
  if (usadas.has(id)) return;
  usadas.add(id);
  medir("uso_demo_promo", null, id);
}
