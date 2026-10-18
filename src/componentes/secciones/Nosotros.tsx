import Image from "next/image";
import { TarjetaViva } from "@/componentes/estructura/TarjetaViva";
import { NOSOTROS } from "@/datos/textos";

type Persona = (typeof NOSOTROS.equipo)[number];

function PerfilEquipo({ persona }: { persona: Persona }) {
  return (
    <TarjetaViva className="border border-profundo" data-revelar>
      <div className="flex items-start gap-6 p-7 md:p-8">
        <div className="relative size-24 shrink-0 border border-profundo md:size-28">
          {persona.foto ? (
            <Image
              src={persona.foto}
              alt={`Foto de ${persona.nombre}`}
              fill
              sizes="112px"
              className="object-cover grayscale"
            />
          ) : (
            // Mientras no haya foto: las iniciales y el punto de la marca.
            <div className="relative flex h-full w-full items-center justify-center">
              <span className="font-michroma text-3xl text-acero">{persona.iniciales}</span>
              <span aria-hidden className="absolute bottom-2 right-2 size-1.5 bg-acero" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {persona.rol}
          </p>
          <h3 className="mt-2 font-plex text-xl font-bold text-blanco">{persona.nombre}</h3>
          <p className="mt-1 font-plex text-sm text-acero">{persona.cargo}</p>
          {persona.titulo ? (
            <p className="mt-1 font-plex text-xs text-acero">{persona.titulo}</p>
          ) : null}
        </div>
      </div>
      <p className="px-7 pb-7 font-lectura text-[15px] leading-relaxed text-acero md:px-8 md:pb-8">
        {persona.bajada}
      </p>
      {persona.linkedin ? (
        <div className="border-t border-profundo px-7 py-4 md:px-8">
          <a
            href={persona.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 font-plex text-xs font-medium uppercase tracking-etiqueta text-acero transition-colors hover:text-blanco"
          >
            <span
              aria-hidden
              className="inline-block size-1 bg-profundo transition-colors group-hover:bg-blanco"
            />
            LinkedIn
          </a>
        </div>
      ) : null}
    </TarjetaViva>
  );
}

/** El capítulo "El equipo" del canal Nosotros: los dos fundadores y la misión. */
export function Equipo() {
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 md:gap-8">
        {NOSOTROS.equipo.map((persona) => (
          <PerfilEquipo key={persona.nombre} persona={persona} />
        ))}
      </div>

      <div className="mt-6 md:mt-8">
        <TarjetaViva className="border border-profundo p-8 md:p-12" data-revelar>
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {NOSOTROS.mision.etiqueta}
          </p>
          <p className="mt-5 max-w-3xl font-plex text-xl font-bold leading-snug text-blanco md:text-2xl">
            {NOSOTROS.mision.texto}
          </p>
        </TarjetaViva>
      </div>
    </>
  );
}
