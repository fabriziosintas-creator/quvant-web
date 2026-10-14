import type { CSSProperties } from "react";
import { ACENTO_SECCION } from "@/datos/colores";
import { RecorridoObjetivo } from "./RecorridoObjetivo";

/**
 * Sección 02 · Nuestro objetivo: el manifiesto, como recorrido atado al
 * scroll. Todo el contenido vive en RecorridoObjetivo (los textos están
 * en el HTML del servidor; el scroll solo elige cuál se ve).
 */
export function Objetivo() {
  return (
    <section
      id="objetivo"
      className="border-t border-profundo"
      style={{ "--acento": ACENTO_SECCION.objetivo } as CSSProperties}
    >
      <RecorridoObjetivo />
    </section>
  );
}
