import type { CSSProperties } from "react";
import { ACENTO_SECCION } from "@/datos/colores";
import Image from "next/image";
import { TarjetaViva } from "@/componentes/estructura/TarjetaViva";
import { NOSOTROS } from "@/datos/textos";
import { FuerzasQueSeJuntan } from "./FuerzasQueSeJuntan";
import { ServiciosInteractivos } from "./ServiciosInteractivos";
import { SpotQuvant } from "./SpotQuvant";

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
      <p className="px-7 pb-7 font-plex text-sm leading-relaxed text-acero md:px-8 md:pb-8">
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

/** Sección 03 · Nosotros: origen, las dos fuerzas, el equipo, la misión,
 *  el spot de 45 s y los tres servicios con tarjetas que se inclinan en 3D. */
export function Nosotros() {
  return (
    <section
      id="nosotros"
      className="border-t border-profundo"
      style={{ "--acento": ACENTO_SECCION.nosotros } as CSSProperties}
    >
      <div className="contenedor py-24 md:py-32">
        <p
          data-revelar
          className="flex items-center gap-3 font-michroma text-xs uppercase tracking-etiqueta text-acero"
        >
          <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
          {NOSOTROS.numero} · {NOSOTROS.etiqueta}
        </p>
        <h2
          data-revelar
          className="mt-6 max-w-3xl font-plex text-3xl font-bold leading-tight text-blanco md:text-5xl"
        >
          {NOSOTROS.titulo}
        </h2>
        <p
          data-revelar
          className="mt-6 max-w-2xl font-plex text-sm leading-relaxed text-acero md:text-base"
        >
          {NOSOTROS.origen}
        </p>

        <FuerzasQueSeJuntan />

        <div className="mt-20 grid gap-5 md:mt-28 md:grid-cols-2 md:gap-8">
          {NOSOTROS.equipo.map((persona) => (
            <PerfilEquipo key={persona.nombre} persona={persona} />
          ))}
        </div>

        <div className="mt-20 md:mt-28">
          <TarjetaViva className="border border-profundo p-8 md:p-12" data-revelar>
            <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
              {NOSOTROS.mision.etiqueta}
            </p>
            <p className="mt-5 max-w-3xl font-plex text-xl font-bold leading-snug text-blanco md:text-2xl">
              {NOSOTROS.mision.texto}
            </p>
          </TarjetaViva>
        </div>

        <div className="mt-10 md:mt-14">
          <SpotQuvant />
        </div>

        <div className="mt-20 md:mt-28">
          <ServiciosInteractivos />
        </div>
      </div>
    </section>
  );
}
