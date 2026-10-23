import type { CSSProperties } from "react";
import { Cara } from "@/componentes/estructura/Foto";
import { EntradaPromo } from "@/componentes/promo/EntradaPromo";
import { ACENTO_CANAL } from "@/datos/colores";
import { fotoDe } from "@/datos/fotos";
import { CONTACTO_SECCION } from "@/datos/textos";
import { FormularioContacto } from "./FormularioContacto";
import { ViasDirectas } from "./ViasDirectas";

/** Las caras de quienes responden. Solo con permiso (src/datos/fotos.ts); en desarrollo, los círculos con el TODO. */
const CARAS = ["nosotros-michel", "nosotros-fabrizio"] as const;

function QuienesResponden() {
  const { presentacion } = CONTACTO_SECCION;
  const hayCaras = process.env.NODE_ENV !== "production" || CARAS.some((id) => fotoDe(id));
  return (
    <div className="mb-10 flex items-center gap-5">
      {hayCaras ? (
        <span className="flex shrink-0 -space-x-3">
          {CARAS.map((id) => (
            <Cara key={id} id={id} tamano="size-12" className="ring-2 ring-negro" />
          ))}
        </span>
      ) : null}
      <div>
        <p className="titulo text-2xl leading-tight text-blanco md:text-3xl">{presentacion.frase}</p>
        <p className="mt-1 font-lectura text-sm leading-relaxed text-acero">
          {presentacion.detalle}
          {presentacion.tiempo ? ` ${presentacion.tiempo}` : ""}
        </p>
      </div>
    </div>
  );
}

/**
 * El canal Contacto, con el lenguaje de las tarjetas de luz (el mismo de
 * las situaciones de la promo): el formulario en una tarjeta verde (el
 * color de Contacto), con quiénes responden arriba (web más humana, paso
 * 8); y al lado, las vías directas, cada una en su tarjeta y con su color.
 */
export function Contacto() {
  return (
    <section>
      <div className="contenedor py-16 md:py-24">
        <EntradaPromo origen="contacto" className="mb-10" />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className="tarjeta-luz entra-luz p-6 md:p-10" style={{ "--acento": ACENTO_CANAL.contacto } as CSSProperties}>
            <QuienesResponden />
            <FormularioContacto />
          </div>

          <div className="flex flex-col gap-6 lg:sticky lg:top-28">
            <p className="titulo text-3xl leading-tight text-blanco md:text-4xl">{CONTACTO_SECCION.directo.titulo}</p>
            <ViasDirectas />
          </div>
        </div>
      </div>
    </section>
  );
}
