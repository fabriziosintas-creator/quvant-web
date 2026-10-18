import type { Metadata } from "next";
import { Capitulo } from "@/componentes/canales/Capitulo";
import { metadatosCanal } from "@/componentes/canales/metadatos";
import { PaginaCanal } from "@/componentes/canales/PaginaCanal";
import { Vitrina } from "@/componentes/secciones/vitrina/Vitrina";
import { CasoFerremix } from "@/componentes/secciones/Webs";
import { CANALES } from "@/datos/textos";

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
      </Capitulo>
    </PaginaCanal>
  );
}
