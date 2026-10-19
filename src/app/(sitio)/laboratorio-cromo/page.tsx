import type { Metadata } from "next";
import { MuestrasDiferidas } from "@/componentes/3d/laboratorio/MuestrasDiferidas";

/**
 * Página interna de trabajo: seis recetas de cromo para elegir la de la
 * portada. No es parte del sitio público (noindex, sin link en el menú);
 * por eso sus textos viven acá y no en src/datos/textos.ts.
 */

export const metadata: Metadata = {
  title: "Laboratorio del cromo — interno",
  robots: { index: false, follow: false },
};

export default function LaboratorioCromo() {
  return (
    <div className="contenedor pb-24 pt-32 md:pt-36">
      <p className="font-michroma text-xs uppercase tracking-etiqueta text-acero">
        Laboratorio · Interno
      </p>
      <h1 className="mt-4 max-w-2xl titulo text-2xl text-blanco md:text-3xl">
        ¿Qué cromo te gusta más?
      </h1>
      <p className="mt-4 max-w-xl font-plex text-sm leading-relaxed text-acero">
        Seis versiones de la misma Q, con el render real del sitio. Mové el mouse:
        las seis giran juntas para comparar los reflejos en el mismo ángulo.
        Cuando tengas la elegida, decime la letra (y si querés, qué le cambiarías:
        más clara, más contraste, veta más fina).
      </p>
      <div className="mt-10 md:mt-14">
        <MuestrasDiferidas />
      </div>
    </div>
  );
}
