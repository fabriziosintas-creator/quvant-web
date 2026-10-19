import type { Metadata } from "next";
import { Capitulo } from "@/componentes/canales/Capitulo";
import { metadatosCanal } from "@/componentes/canales/metadatos";
import { PaginaCanal } from "@/componentes/canales/PaginaCanal";
import { FuerzasQueSeJuntan } from "@/componentes/secciones/FuerzasQueSeJuntan";
import { Equipo } from "@/componentes/secciones/Nosotros";
import { SpotQuvant } from "@/componentes/secciones/SpotQuvant";
import { CANALES } from "@/datos/textos";

const [FUERZAS, EQUIPO, VIDEO] = CANALES[3].capitulos;

export const metadata: Metadata = metadatosCanal("nosotros");

/** Canal 04 · Nosotros: las dos fuerzas, el equipo con la misión y el spot de 45 s. */
export default function Nosotros() {
  return (
    <PaginaCanal id="nosotros">
      <Capitulo id={FUERZAS.id} etiqueta={FUERZAS.nombre}>
        <FuerzasQueSeJuntan />
      </Capitulo>
      <Capitulo id={EQUIPO.id} etiqueta={EQUIPO.nombre}>
        <Equipo />
      </Capitulo>
      <Capitulo id={VIDEO.id} etiqueta={VIDEO.nombre}>
        <SpotQuvant />
      </Capitulo>
    </PaginaCanal>
  );
}
