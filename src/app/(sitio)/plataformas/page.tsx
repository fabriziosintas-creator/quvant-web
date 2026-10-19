import type { Metadata } from "next";
import { Capitulo } from "@/componentes/canales/Capitulo";
import { metadatosCanal } from "@/componentes/canales/metadatos";
import { PaginaCanal } from "@/componentes/canales/PaginaCanal";
import { LoQueHaceHoy } from "@/componentes/secciones/Plataformas";
import { SelectorRubros } from "@/componentes/secciones/SelectorRubros";
import { CANALES } from "@/datos/textos";

const [HOY, RUBROS] = CANALES[2].capitulos;

export const metadata: Metadata = metadatosCanal("plataformas");

/** Canal 03 · Plataformas: lo que el sistema hace hoy (y lo que viene) y los rubros. */
export default function Plataformas() {
  return (
    <PaginaCanal id="plataformas">
      <Capitulo id={HOY.id} etiqueta={HOY.nombre}>
        <LoQueHaceHoy />
      </Capitulo>
      <Capitulo id={RUBROS.id} etiqueta={RUBROS.nombre}>
        <SelectorRubros />
      </Capitulo>
    </PaginaCanal>
  );
}
