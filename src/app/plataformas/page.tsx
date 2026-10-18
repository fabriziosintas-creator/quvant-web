import type { Metadata } from "next";
import { Capitulo } from "@/componentes/canales/Capitulo";
import { metadatosCanal } from "@/componentes/canales/metadatos";
import { PaginaCanal } from "@/componentes/canales/PaginaCanal";
import { Integraciones, LoQueHaceHoy } from "@/componentes/secciones/Plataformas";
import { SelectorRubros } from "@/componentes/secciones/SelectorRubros";
import { CANALES, PLATAFORMAS } from "@/datos/textos";

const [HOY, RUBROS, INTEGRACIONES] = CANALES[2].capitulos;

export const metadata: Metadata = metadatosCanal("plataformas");

/** Canal 03 · Plataformas: lo que el sistema hace hoy, los rubros y lo que viene. */
export default function Plataformas() {
  return (
    <PaginaCanal id="plataformas">
      <Capitulo id={HOY.id} etiqueta={HOY.nombre}>
        <LoQueHaceHoy />
      </Capitulo>
      <Capitulo id={RUBROS.id} etiqueta={RUBROS.nombre}>
        <SelectorRubros />
      </Capitulo>
      <Capitulo id={INTEGRACIONES.id} etiqueta={PLATAFORMAS.integraciones.etiqueta}>
        <Integraciones />
      </Capitulo>
    </PaginaCanal>
  );
}
