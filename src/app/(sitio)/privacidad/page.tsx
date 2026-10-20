import type { Metadata } from "next";
import { MarcoCuenta } from "@/componentes/cuenta/MarcoCuenta";
import { CONTACTO, urlEmail, urlInstagram, urlWhatsApp } from "@/datos/contacto";
import { PRIVACIDAD } from "@/datos/textos";

export const metadata: Metadata = {
  title: `${PRIVACIDAD.metaTitulo} | Quvant`,
  alternates: { canonical: "/privacidad" },
};

/**
 * Política de privacidad (Ley 25.326).
 * TODO: revisar con un abogado antes de difundir (ver PRIVACIDAD en textos.ts).
 */
export default function Privacidad() {
  return (
    <MarcoCuenta etiqueta={PRIVACIDAD.metaTitulo} titulo={PRIVACIDAD.titulo} bajada={PRIVACIDAD.actualizada} ancho="lectura">
      <p className="mb-10 flex items-center gap-3 border border-profundo px-4 py-3 font-plex text-xs uppercase tracking-etiqueta text-acero">
        <span aria-hidden className="size-1.5 bg-acero" />
        {PRIVACIDAD.borrador}
      </p>
      <div className="flex flex-col gap-10">
        {PRIVACIDAD.secciones.map((seccion) => (
          <section key={seccion.titulo}>
            <h2 className="titulo text-xl text-blanco md:text-2xl">{seccion.titulo}</h2>
            {seccion.parrafos.map((parrafo) => (
              <p key={parrafo.slice(0, 40)} className="mt-4 font-lectura text-base leading-relaxed text-acero">
                {parrafo}
              </p>
            ))}
          </section>
        ))}
        <section>
          <h2 className="titulo text-xl text-blanco md:text-2xl">{PRIVACIDAD.contacto}</h2>
          <ul className="mt-4 flex flex-col gap-2 font-plex text-sm text-acero">
            <li>
              WhatsApp:{" "}
              <a href={urlWhatsApp()} className="text-blanco underline decoration-profundo underline-offset-4 hover:decoration-blanco">
                {CONTACTO.whatsappVisible}
              </a>
            </li>
            <li>
              Email:{" "}
              <a href={urlEmail} className="text-blanco underline decoration-profundo underline-offset-4 hover:decoration-blanco">
                {CONTACTO.email}
              </a>
            </li>
            <li>
              Instagram:{" "}
              <a href={urlInstagram} className="text-blanco underline decoration-profundo underline-offset-4 hover:decoration-blanco">
                @{CONTACTO.instagram}
              </a>
            </li>
          </ul>
        </section>
      </div>
    </MarcoCuenta>
  );
}
