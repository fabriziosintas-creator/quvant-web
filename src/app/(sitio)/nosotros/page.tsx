import type { Metadata } from "next";
import { Capitulo } from "@/componentes/canales/Capitulo";
import { metadatosCanal } from "@/componentes/canales/metadatos";
import { PaginaCanal } from "@/componentes/canales/PaginaCanal";
import { FuerzasQueSeJuntan } from "@/componentes/secciones/FuerzasQueSeJuntan";
import { SpotQuvant } from "@/componentes/secciones/SpotQuvant";
import { CANALES } from "@/datos/textos";

const [FUERZAS, VIDEO] = CANALES[3].capitulos;

export const metadata: Metadata = metadatosCanal("nosotros");

/**
 * Canal 04 · Nosotros: las dos fuerzas (cada una con su persona) y el spot
 * de 42 s. El capítulo "El equipo" y la caja de la misión se sacaron el
 * 19-oct-2026: repetían las fuerzas y, sin fotos, las iniciales parecían un
 * lugar vacío. Las fotos van en las tarjetas de las fuerzas.
 */
export default function Nosotros() {
  return (
    <PaginaCanal id="nosotros">
      <Capitulo id={FUERZAS.id} etiqueta={FUERZAS.nombre}>
        <FuerzasQueSeJuntan />
      </Capitulo>
      <Capitulo id={VIDEO.id} etiqueta={VIDEO.nombre}>
        <SpotQuvant />
      </Capitulo>
    </PaginaCanal>
  );
}
