import { PLATAFORMAS } from "@/datos/textos";
import { RecorridoTablero } from "./RecorridoTablero";
import { SelectorRubros } from "./SelectorRubros";

/** Sección 03 · Plataformas: el núcleo, lo que hace hoy, los rubros con
 *  sus productos (Yunque, Forja, HackFit y los que vienen) y las
 *  integraciones que todavía no están, dichas como lo que son. */
export function Plataformas() {
  return (
    <section id="plataformas" className="border-t border-profundo">
      <div className="contenedor py-24 md:py-32">
        <p className="font-michroma text-xs uppercase tracking-etiqueta text-acero">
          {PLATAFORMAS.numero} · {PLATAFORMAS.etiqueta}
        </p>
        <h2 className="mt-6 max-w-3xl font-plex text-3xl font-bold leading-tight text-blanco md:text-5xl">
          {PLATAFORMAS.titulo}
        </h2>
        <p className="mt-6 max-w-2xl font-plex text-sm leading-relaxed text-acero md:text-base">
          {PLATAFORMAS.bajada}
        </p>

        {/* El núcleo común */}
        <div className="mt-12 md:mt-16">
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {PLATAFORMAS.nucleo.etiqueta}
          </p>
          <ul className="mt-5 flex flex-wrap gap-3">
            {PLATAFORMAS.nucleo.modulos.map((modulo) => (
              <li
                key={modulo}
                className="flex items-center gap-2.5 border border-profundo px-4 py-2.5 font-plex text-xs font-medium uppercase tracking-etiqueta text-blanco"
              >
                <span aria-hidden className="size-1 bg-acero" />
                {modulo}
              </li>
            ))}
          </ul>
        </div>

        {/* Lo que hace hoy */}
        <div className="mt-20 md:mt-28">
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {PLATAFORMAS.hoy.etiqueta}
          </p>
          <RecorridoTablero />

          {/* Lo que no entró en el recorrido, en una fila de fichas. */}
          <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-3">
            <span className="mr-2 font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
              {PLATAFORMAS.hoy.etiquetaResto}
            </span>
            {PLATAFORMAS.hoy.resto.map((item) => (
              <span
                key={item}
                className="flex items-center gap-2.5 border border-profundo px-3.5 py-2 font-plex text-xs text-acero"
              >
                <span aria-hidden className="size-1 bg-profundo" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Rubros y productos */}
        <div className="mt-20 md:mt-28">
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {PLATAFORMAS.rubros.etiqueta}
          </p>
          <SelectorRubros />
        </div>

        {/* Integraciones en camino: lo que todavía no está, dicho como tal. */}
        <div className="mt-20 border border-profundo p-7 md:mt-28 md:p-9">
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {PLATAFORMAS.integraciones.etiqueta}
          </p>
          <ul className="mt-5 flex flex-wrap gap-3">
            {PLATAFORMAS.integraciones.items.map((item) => (
              <li
                key={item}
                className="border border-profundo px-4 py-2.5 font-plex text-xs uppercase tracking-etiqueta text-acero"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 font-plex text-sm text-acero">{PLATAFORMAS.integraciones.nota}</p>
        </div>
      </div>
    </section>
  );
}
