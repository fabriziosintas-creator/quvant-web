import { BotonAbrirChat } from "@/componentes/chat/BotonAbrirChat";
import { CONTACTO, urlEmail, urlInstagram, urlWhatsApp } from "@/datos/contacto";
import { CONTACTO_SECCION } from "@/datos/textos";
import { FormularioContacto } from "./FormularioContacto";

function Directo({ url, etiqueta, valor }: { url: string; etiqueta: string; valor: string }) {
  return (
    <li>
      <a href={url} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-1">
        <span className="flex items-center gap-2.5 font-lectura text-sm font-medium text-acero">
          <span aria-hidden className="inline-block size-1 bg-profundo transition-colors group-hover:bg-blanco" />
          {etiqueta}
        </span>
        <span className="font-plex text-sm text-blanco transition-colors group-hover:text-acero">{valor}</span>
      </a>
    </li>
  );
}

/**
 * El canal Contacto: el formulario sin servidor, suelto (sin caja), y
 * abajo, en una sola línea, las vías directas: el chat, WhatsApp, email e
 * Instagram.
 */
export function Contacto() {
  return (
    <section className="border-t border-profundo">
      <div className="contenedor py-16 md:py-24">
        <div className="max-w-3xl">
          <FormularioContacto />
        </div>

        <div
          data-revelar
          className="mt-16 flex flex-col gap-8 border-t border-profundo pt-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <p className="titulo text-lg text-blanco md:text-xl">{CONTACTO_SECCION.directo.titulo}</p>
            <BotonAbrirChat />
          </div>
          <ul className="flex flex-wrap gap-x-10 gap-y-5">
            <Directo url={urlWhatsApp()} etiqueta={CONTACTO_SECCION.directo.filas.whatsapp} valor={CONTACTO.whatsappVisible} />
            <Directo url={urlEmail} etiqueta={CONTACTO_SECCION.directo.filas.email} valor={CONTACTO.email} />
            <Directo url={urlInstagram} etiqueta={CONTACTO_SECCION.directo.filas.instagram} valor={`@${CONTACTO.instagram}`} />
          </ul>
        </div>
      </div>
    </section>
  );
}
