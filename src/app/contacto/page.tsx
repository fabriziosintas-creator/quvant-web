import type { Metadata } from "next";
import { metadatosCanal } from "@/componentes/canales/metadatos";
import { PaginaCanal } from "@/componentes/canales/PaginaCanal";
import { Contacto as ContenidoContacto } from "@/componentes/secciones/Contacto";

export const metadata: Metadata = metadatosCanal("contacto");

/** Canal 05 · Contacto: el formulario que arma el mensaje y las vías directas. */
export default function Contacto() {
  return (
    <PaginaCanal id="contacto">
      <ContenidoContacto />
    </PaginaCanal>
  );
}
