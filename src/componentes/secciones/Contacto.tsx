import { CONTACTO, urlEmail, urlInstagram, urlWhatsApp } from "@/datos/contacto";
import { CONTACTO_SECCION, MARCA } from "@/datos/textos";
import { FormularioContacto } from "./FormularioContacto";

function FilaDirecta({ url, etiqueta, valor }: { url: string; etiqueta: string; valor: string }) {
  return (
    <li>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-baseline justify-between gap-4 border-b border-profundo py-3.5"
      >
        <span className="flex items-center gap-3 font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
          <span
            aria-hidden
            className="inline-block size-1 bg-profundo transition-colors group-hover:bg-blanco"
          />
          {etiqueta}
        </span>
        <span className="truncate font-plex text-sm text-blanco transition-colors group-hover:text-acero">
          {valor}
        </span>
      </a>
    </li>
  );
}

/** Sección 05 · Contacto: el formulario sin servidor y las vías directas. */
export function Contacto() {
  return (
    <section id="contacto" className="border-t border-profundo">
      <div className="contenedor py-24 md:py-32">
        <p className="font-michroma text-xs uppercase tracking-etiqueta text-acero">
          {CONTACTO_SECCION.numero} · {CONTACTO_SECCION.etiqueta}
        </p>
        <h2 className="mt-6 max-w-3xl font-plex text-3xl font-bold leading-tight text-blanco md:text-5xl">
          {CONTACTO_SECCION.titulo}
        </h2>
        <p className="mt-6 max-w-2xl font-plex text-sm leading-relaxed text-acero md:text-base">
          {CONTACTO_SECCION.bajada}
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 md:mt-16">
          <FormularioContacto />

          <aside className="h-fit border border-profundo p-7 md:p-9">
            <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
              {CONTACTO_SECCION.directo.etiqueta}
            </p>
            <p className="mt-4 font-plex text-lg font-bold text-blanco">
              {CONTACTO_SECCION.directo.titulo}
            </p>
            <ul className="mt-5">
              <FilaDirecta
                url={urlWhatsApp()}
                etiqueta={CONTACTO_SECCION.directo.filas.whatsapp}
                valor={`+${CONTACTO.whatsapp}`}
              />
              <FilaDirecta
                url={urlEmail}
                etiqueta={CONTACTO_SECCION.directo.filas.email}
                valor={CONTACTO.email}
              />
              <FilaDirecta
                url={urlInstagram}
                etiqueta={CONTACTO_SECCION.directo.filas.instagram}
                valor={`@${CONTACTO.instagram}`}
              />
            </ul>
            <p className="mt-6 flex items-center gap-3 font-plex text-xs text-acero">
              <span aria-hidden className="inline-block size-1.5 bg-blanco" />
              {MARCA.bajada}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
