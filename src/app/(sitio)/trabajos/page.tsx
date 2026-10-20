import type { Metadata } from "next";
import { Capitulo } from "@/componentes/canales/Capitulo";
import { metadatosCanal } from "@/componentes/canales/metadatos";
import { PaginaCanal } from "@/componentes/canales/PaginaCanal";
import { Vitrina } from "@/componentes/secciones/vitrina/Vitrina";
import { Testimonios } from "@/componentes/secciones/Testimonios";
import { CasoFerremix } from "@/componentes/secciones/Webs";
import { TESTIMONIOS } from "@/datos/testimonios";
import { CANALES, WEBS } from "@/datos/textos";

const [PORTFOLIO, CASO] = CANALES[0].capitulos;

export const metadata: Metadata = metadatosCanal("trabajos");

/** Canal 01 · Trabajos: el portfolio entero y un caso de cerca. */
export default function Trabajos() {
  return (
    <PaginaCanal id="trabajos">
      <Capitulo id={PORTFOLIO.id} etiqueta={PORTFOLIO.nombre}>
        <Vitrina />
      </Capitulo>
      <Capitulo id={CASO.id} etiqueta={CASO.nombre}>
        <CasoFerremix />
        {/* Solo aparece cuando hay testimonios reales (src/datos/testimonios.ts). */}
        {TESTIMONIOS.length > 0 ? (
          <div className="mt-16">
            <p className="mb-6 font-lectura text-sm font-medium text-acero">{WEBS.testimonios}</p>
            <Testimonios />
          </div>
        ) : null}
      </Capitulo>
    </PaginaCanal>
  );
}
