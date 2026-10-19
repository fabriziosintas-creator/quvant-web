import { ViewTransition, type CSSProperties, type ReactNode } from "react";
import { ACENTO_CANAL, type IdCanal } from "@/datos/colores";
import { NAVEGACION } from "@/datos/textos";
import { DESLIZ_PAGINA, canalPorId, numeroCanal } from "./navegacion";
import { RielCapitulos } from "./RielCapitulos";
import { SiguienteCanal } from "./SiguienteCanal";

/**
 * La página de un canal: arriba, el número y el nombre del canal (que viaja
 * desde la tarjeta de la portada o desde el final de la página anterior),
 * el título y una sola línea de bajada; después los capítulos, con su riel;
 * al final, la línea que conecta con el canal siguiente.
 *
 * Toda la página se desliza al cambiar de canal: hacia la izquierda si se
 * avanza en el recorrido, hacia la derecha si se vuelve (ver navegacion.ts).
 */
export function PaginaCanal({ id, children }: { id: IdCanal; children: ReactNode }) {
  const canal = canalPorId(id);

  return (
    <ViewTransition enter={DESLIZ_PAGINA} exit={DESLIZ_PAGINA} default="none">
      <div className="relative" style={{ "--acento": ACENTO_CANAL[id] } as CSSProperties}>
        {/* El color del canal, apenas, detrás del título. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
          style={{
            background:
              "radial-gradient(ellipse 55% 65% at 12% 0%, color-mix(in srgb, var(--acento) 16%, transparent), transparent 70%)",
          }}
        />
        <header className="contenedor relative pb-12 pt-28 md:pb-16 md:pt-40">
          <p className="flex items-center gap-3 font-michroma text-xs uppercase tracking-etiqueta text-acero">
            <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
            {NAVEGACION.canal} {numeroCanal(id)}
            <span aria-hidden className="h-px w-8 bg-profundo" />
            <ViewTransition name={`canal-${id}`} share="morph-web" default="none">
              <span className="text-blanco">{canal.nombre}</span>
            </ViewTransition>
          </p>
          <h1 className="mt-6 max-w-4xl titulo text-[clamp(2rem,6vw,4rem)] leading-[1.08] text-blanco">
            {canal.titulo}
          </h1>
          <p className="mt-6 max-w-2xl font-lectura text-base leading-relaxed text-acero md:text-lg">
            {canal.bajada}
          </p>
        </header>

        {canal.capitulos.length > 0 ? <RielCapitulos capitulos={canal.capitulos} /> : null}

        {children}

        <SiguienteCanal id={id} />
      </div>
    </ViewTransition>
  );
}
