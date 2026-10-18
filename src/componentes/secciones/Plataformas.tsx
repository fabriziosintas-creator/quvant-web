import { TarjetaViva } from "@/componentes/estructura/TarjetaViva";
import { PLATAFORMAS } from "@/datos/textos";
import { RecorridoTablero } from "./RecorridoTablero";

/**
 * Los capítulos del canal Plataformas que no son un componente entero:
 * "Lo que hace hoy" (el recorrido por el tablero real y, abajo, lo que no
 * entró en el recorrido) y las integraciones que todavía no están, dichas
 * como lo que son. Los rubros son SelectorRubros.
 *
 * (El bloque "El núcleo común" se sacó el 18-oct-2026: el núcleo ya lo
 * explica la bajada del canal.)
 */
export function LoQueHaceHoy() {
  return (
    <>
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
            <span aria-hidden className="size-1 bg-[var(--acento)]" />
            {item}
          </span>
        ))}
      </div>
    </>
  );
}

export function Integraciones() {
  return (
    <TarjetaViva className="border border-profundo p-7 md:p-9" data-revelar>
      <ul className="flex flex-wrap gap-3">
        {PLATAFORMAS.integraciones.items.map((item, indice) => (
          <li
            key={item}
            className="flex items-center gap-2.5 border border-profundo px-4 py-2.5 font-plex text-xs uppercase tracking-etiqueta text-acero"
          >
            {/* El punto late: está en camino, todavía no llegó. */}
            <span
              aria-hidden
              className="size-1 bg-[var(--acento)] motion-safe:animate-[parpadeo_1.8s_steps(2,end)_infinite]"
              style={{ animationDelay: `${indice * 0.6}s` }}
            />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-5 font-lectura text-[15px] text-acero">{PLATAFORMAS.integraciones.nota}</p>
    </TarjetaViva>
  );
}
