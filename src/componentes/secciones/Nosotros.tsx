import Image from "next/image";
import { NOSOTROS } from "@/datos/textos";
import { FuerzasQueSeJuntan } from "./FuerzasQueSeJuntan";
import { ServiciosInteractivos } from "./ServiciosInteractivos";

type Persona = (typeof NOSOTROS.equipo)[number];

function Habilidad({ nombre, nivel }: { nombre: string; nivel: number }) {
  return (
    <div
      className="flex items-center justify-between gap-4"
      role="img"
      aria-label={`${nombre}: ${nivel} de 5`}
    >
      <span className="font-plex text-xs uppercase tracking-etiqueta text-acero">{nombre}</span>
      <span aria-hidden className="flex gap-[5px]">
        {[1, 2, 3, 4, 5].map((marca) => (
          <span
            key={marca}
            className={`h-3.5 w-[3px] ${marca <= nivel ? "bg-blanco" : "bg-profundo"}`}
          />
        ))}
      </span>
    </div>
  );
}

function PerfilEquipo({ persona }: { persona: Persona }) {
  return (
    <article className="flex flex-col border border-profundo">
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
      <p className="px-7 font-plex text-sm leading-relaxed text-acero md:px-8">{persona.bajada}</p>
      <div className="mt-auto flex flex-col gap-3 px-7 py-7 md:px-8">
        {persona.habilidades.map((habilidad) => (
          <Habilidad key={habilidad.nombre} nombre={habilidad.nombre} nivel={habilidad.nivel} />
        ))}
      </div>
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
    </article>
  );
}

/** Sección 02 · Nosotros: origen, las dos fuerzas, el equipo, la misión
 *  y los tres servicios con tarjetas que se inclinan en 3D. */
export function Nosotros() {
  return (
    <section id="nosotros" className="border-t border-profundo">
      <div className="contenedor py-24 md:py-32">
        <p className="font-michroma text-xs uppercase tracking-etiqueta text-acero">
          {NOSOTROS.numero} · {NOSOTROS.etiqueta}
        </p>
        <h2 className="mt-6 max-w-3xl font-plex text-3xl font-bold leading-tight text-blanco md:text-5xl">
          {NOSOTROS.titulo}
        </h2>
        <p className="mt-6 max-w-2xl font-plex text-sm leading-relaxed text-acero md:text-base">
          {NOSOTROS.origen}
        </p>

        <FuerzasQueSeJuntan />

        <div className="mt-20 grid gap-5 md:mt-28 md:grid-cols-2 md:gap-8">
          {NOSOTROS.equipo.map((persona) => (
            <PerfilEquipo key={persona.nombre} persona={persona} />
          ))}
        </div>

        <div className="mt-20 border border-profundo p-8 md:mt-28 md:p-12">
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {NOSOTROS.mision.etiqueta}
          </p>
          <p className="mt-5 max-w-3xl font-plex text-xl font-bold leading-snug text-blanco md:text-2xl">
            {NOSOTROS.mision.texto}
          </p>
        </div>

        <div className="mt-20 md:mt-28">
          <ServiciosInteractivos />
        </div>
      </div>
    </section>
  );
}
