import { PLATAFORMAS } from "@/datos/textos";
import { RecorridoTablero } from "./RecorridoTablero";

/**
 * "Lo que hace hoy", el primer capítulo del canal Plataformas: el
 * recorrido por el tablero real y, abajo, lo que no entró en el recorrido
 * y las integraciones que todavía no están, dichas como lo que son (una
 * línea, sin caja: el 19-oct-2026 dejaron de ser un capítulo aparte). Los
 * rubros son SelectorRubros.
 *
 * (El bloque "El núcleo común" se sacó el 18-oct-2026: el núcleo ya lo
 * explica la bajada del canal.)
 */
export function LoQueHaceHoy() {
  const { integraciones } = PLATAFORMAS;
  return (
    <>
      <RecorridoTablero />

      {/* Lo que no entró en el recorrido, en una fila de fichas. */}
      <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-3">
        <span className="mr-2 font-lectura text-sm font-medium text-acero">
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

      {/* Lo que viene: una línea, con el punto que late (está en camino, todavía no llegó). */}
      <div data-revelar className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-profundo pt-6">
        <h3 className="font-lectura text-sm font-medium text-acero">{integraciones.etiqueta}</h3>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {integraciones.items.map((item, indice) => (
            <li key={item} className="flex items-center gap-2.5 font-lectura text-sm text-blanco">
              <span
                aria-hidden
                className="size-1.5 bg-[var(--acento)] motion-safe:animate-[parpadeo_2.9s_ease-in-out_infinite]"
                style={{ animationDelay: `${indice * 0.6}s` }}
              />
              {item}
            </li>
          ))}
        </ul>
        <p className="font-lectura text-sm text-acero">{integraciones.nota}</p>
      </div>
    </>
  );
}
