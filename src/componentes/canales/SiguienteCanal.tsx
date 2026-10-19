import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";
import { ACENTO_CANAL, type IdCanal } from "@/datos/colores";
import { NAVEGACION } from "@/datos/textos";
import { IconoCanal } from "./IconoCanal";
import { canalPorId, canalSiguiente, tipoTransicion } from "./navegacion";

/**
 * El canal de conexión al final de cada página: una línea que baja desde
 * el color de este canal al del siguiente, con un pulso que la recorre, y
 * desemboca en la tarjeta del canal que sigue. El nombre del canal de
 * destino comparte transición con el encabezado de su página: al entrar,
 * la palabra viaja hasta su lugar.
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
          className="group relative mt-6 block w-full overflow-hidden rounded-[16px] border border-profundo p-7 transition-colors duration-(--duracion-media) hover:border-[var(--hacia)] data-[en-foco=si]:border-[var(--hacia)] md:p-12"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-(--duracion-media) group-hover:opacity-80 group-data-[en-foco=si]:opacity-80"
            style={{
              background:
                "radial-gradient(ellipse 55% 90% at 85% 100%, color-mix(in srgb, var(--hacia) 22%, transparent), transparent 70%)",
            }}
          />
          {/* En el celular el ícono y la flecha van abajo: el nombre necesita todo el ancho. */}
          <span className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <span className="min-w-0">
              <span className="flex items-center gap-3 font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
                <span aria-hidden className="size-1.5 bg-[var(--hacia)]" />
                {NAVEGACION.siguiente}
              </span>
              <ViewTransition name={`canal-${idSiguiente}`} share="morph-web" default="none">
                <span className="mt-4 block font-michroma text-[clamp(1.25rem,6vw,3.75rem)] uppercase leading-none tracking-[0.12em] text-blanco md:tracking-marca">
                  {siguiente.nombre}
                </span>
              </ViewTransition>
              <span className="mt-4 block max-w-xl font-lectura text-sm leading-relaxed text-acero md:text-base">
                {siguiente.frase}
              </span>
            </span>
            <span className="flex shrink-0 items-center justify-between gap-6 md:flex-col md:items-end">
              <IconoCanal id={idSiguiente} className="size-7 text-[var(--hacia)] md:size-9" />
              <span
                aria-hidden
                className="flex size-11 items-center justify-center border border-profundo font-plex text-lg text-blanco transition-[transform,border-color] duration-(--duracion-rapida) group-hover:translate-x-1 group-hover:border-[var(--hacia)] group-data-[en-foco=si]:translate-x-1 group-data-[en-foco=si]:border-[var(--hacia)] md:size-14"
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
