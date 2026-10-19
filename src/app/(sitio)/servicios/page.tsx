import type { Metadata } from "next";
import { Capitulo } from "@/componentes/canales/Capitulo";
import { metadatosCanal } from "@/componentes/canales/metadatos";
import { PaginaCanal } from "@/componentes/canales/PaginaCanal";
import { RecorridoObjetivo } from "@/componentes/secciones/RecorridoObjetivo";
import { ServiciosInteractivos } from "@/componentes/secciones/ServiciosInteractivos";
import { CANALES } from "@/datos/textos";

const [QUE_HACEMOS, COMO] = CANALES[1].capitulos;

export const metadata: Metadata = metadatosCanal("servicios");

/** Canal 02 · Servicios: los tres servicios y el método, como recorrido atado al scroll. */
export default function Servicios() {
  return (
    <PaginaCanal id="servicios">
      <Capitulo id={QUE_HACEMOS.id} etiqueta={QUE_HACEMOS.nombre}>
        <ServiciosInteractivos />
      </Capitulo>
      <Capitulo id={COMO.id} etiqueta={COMO.nombre} sinContenedor>
        <RecorridoObjetivo />
      </Capitulo>
    </PaginaCanal>
  );
}
