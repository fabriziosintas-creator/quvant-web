import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";
import { ACENTO_CANAL, type IdCanal } from "@/datos/colores";
import { NAVEGACION } from "@/datos/textos";
import { IconoCanal } from "./IconoCanal";
import { canalPorId, canalSiguiente, tipoTransicion } from "./navegacion";

/**
 * El canal de conexión al final de cada página: una línea que baja desde
 * el color de este canal al del siguiente, con un pulso que la recorre, y
 * desemboca en el nombre del canal que sigue, a todo el ancho y sin
 * recuadro. Al pasar el mouse (o, en el celular, al llegar al centro de la
 * pantalla) el nombre se llena con el color de su canal de izquierda a
 * derecha. El nombre comparte transición con el encabezado de su página:
 * al entrar, la palabra viaja hasta su lugar.
 */
export function SiguienteCanal({ id }: { id: IdCanal }) {
  const actual = canalPorId(id);
  const siguiente = canalSiguiente(id);
  const idSiguiente = siguiente.id as IdCanal;

  return (
    <section
      className="border-t border-profundo"
      style={
        {
          "--desde": ACENTO_CANAL[id],
          "--hacia": ACENTO_CANAL[idSiguiente],
        } as CSSProperties
      }
    >
      <div className="contenedor flex flex-col items-center pb-20 md:pb-28">
        {/* La línea que conecta los dos canales. */}
        <span aria-hidden className="relative block h-20 w-px bg-[linear-gradient(var(--desde),var(--hacia))] md:h-28">
          {/* El riel del pulso ocupa toda la línea: así baja con transform (sin recalcular la página). */}
          <span className="pulso-canal absolute inset-y-0 -left-[2px] block w-[5px]">
            <span className="block size-[5px] bg-blanco" />
          </span>
        </span>
        <span aria-hidden className="size-2.5 border border-[var(--hacia)] bg-negro" />

        <Link
          href={siguiente.ruta}
          transitionTypes={[tipoTransicion(actual.ruta, siguiente.ruta)]}
          data-cursor-texto={NAVEGACION.siguiente}
          data-foco-tactil
          className="group relative mt-8 block w-full py-6 md:mt-10 md:py-8"
        >
          {/* El color del canal que sigue, apenas, debajo del nombre (más fuerte al pasar). */}
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-x-[10%] inset-y-0 opacity-50 transition-opacity duration-(--duracion-media) group-hover:opacity-100 group-data-[en-foco=si]:opacity-100"
            style={{
              background:
                "radial-gradient(ellipse 50% 70% at 50% 100%, color-mix(in srgb, var(--hacia) 18%, transparent), transparent 70%)",
            }}
          />
          <span className="relative flex items-center justify-center gap-3 font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            <span aria-hidden className="size-1.5 bg-[var(--hacia)]" />
            {NAVEGACION.siguiente}
          </span>
          <ViewTransition name={`canal-${idSiguiente}`} share="morph-web" default="none">
            {/* Dos colores en el texto (el del canal a la izquierda, blanco a la
                derecha) y el fondo corrido: al pasar, se corre y lo llena. */}
            <span className="relative mt-5 block bg-[linear-gradient(90deg,var(--hacia)_50%,var(--color-blanco)_50%)] bg-[length:200%_100%] bg-[position:100%_0] bg-clip-text text-center whitespace-nowrap font-michroma text-[clamp(1.5rem,7.4vw,5.75rem)] uppercase leading-[0.95] tracking-[0.06em] text-transparent transition-[background-position] duration-(--duracion-lenta) ease-quvant group-hover:bg-[position:0_0] group-data-[en-foco=si]:bg-[position:0_0]">
              {siguiente.nombre}
            </span>
          </ViewTransition>
          <span className="relative mt-6 flex flex-col items-center gap-5 md:flex-row md:justify-center md:gap-8">
            <span className="max-w-xl text-center font-lectura text-sm leading-relaxed text-acero md:text-base">
              {siguiente.frase}
            </span>
            <span className="flex items-center gap-4">
              <IconoCanal id={idSiguiente} className="size-6 text-[var(--hacia)]" />
              <span
                aria-hidden
                className="flex size-11 items-center justify-center border border-profundo font-plex text-lg text-blanco transition-[transform,border-color] duration-(--duracion-rapida) group-hover:translate-x-1 group-hover:border-[var(--hacia)] group-data-[en-foco=si]:translate-x-1 group-data-[en-foco=si]:border-[var(--hacia)] md:size-12"
              >
                →
              </span>
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
