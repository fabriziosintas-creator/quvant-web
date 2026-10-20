import type { ReactNode } from "react";

/**
 * Las piezas de los gráficos del panel, en HTML (sin librería: no pesan,
 * se leen con lector de pantalla y se ven nítidas en el celular).
 *
 * Reglas (guía de visualización + manual): un solo color para la magnitud
 * (blanco sobre negro, en barras finas que crecen desde la misma base); el
 * color del rubro solo como punto al lado del nombre, nunca en el texto;
 * el valor al final de cada barra; los números en Plex Mono tabular.
 */

export function PuntoRubro({ acento }: { acento?: string }) {
  return <span aria-hidden className="size-1.5 shrink-0" style={{ background: acento ?? "#9C9CA3" }} />;
}

/** Una tarjeta con un número grande (los indicadores de arriba). */
export function Indicador({ etiqueta, valor, detalle }: { etiqueta: string; valor: ReactNode; detalle?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 border border-profundo p-4 md:p-5">
      <p className="font-plex text-[11px] font-medium uppercase leading-snug tracking-etiqueta text-acero">{etiqueta}</p>
      <p className="font-michroma text-2xl leading-none text-blanco md:text-3xl">{valor}</p>
      {detalle ? <p className="font-plex text-xs text-acero">{detalle}</p> : null}
    </div>
  );
}

export type FilaBarra = { id: string; etiqueta: string; valor: number; acento?: string; detalle?: string };

/** Barras horizontales: una fila por categoría, la barra proporcional al máximo y el valor al final. */
export function Barras({
  titulo,
  filas,
  formato = (n) => String(n),
  unidad,
}: {
  titulo: string;
  filas: FilaBarra[];
  formato?: (valor: number) => string;
  unidad?: string;
}) {
  const maximo = Math.max(1, ...filas.map((fila) => fila.valor));
  return (
    <figure className="flex min-w-0 flex-col gap-4 border border-profundo p-4 md:p-5">
      <figcaption className="font-plex text-[11px] font-medium uppercase tracking-etiqueta text-blanco">{titulo}</figcaption>
      <ul className="flex flex-col">
        {filas.map((fila) => {
          const texto = `${fila.etiqueta}: ${formato(fila.valor)}${unidad ? ` ${unidad}` : ""}${fila.detalle ? ` (${fila.detalle})` : ""}`;
          return (
            <li
              key={fila.id}
              title={texto}
              className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)_auto] items-center gap-3 py-1.5 transition-colors hover:bg-profundo/40 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto]"
            >
              <span className="flex min-w-0 items-center gap-2 font-plex text-xs text-acero">
                <PuntoRubro acento={fila.acento} />
                <span className="truncate">{fila.etiqueta}</span>
              </span>
              <span aria-hidden className="h-2.5 bg-profundo/50">
                <span className="block h-full bg-blanco" style={{ width: `${(fila.valor / maximo) * 100}%` }} />
              </span>
              <span className="min-w-8 text-right font-plex text-xs tabular-nums text-blanco">
                <span className="sr-only">{texto}</span>
                <span aria-hidden>{formato(fila.valor)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/** Un bloque del panel con título y una línea de explicación. */
export function Bloque({ titulo, nota, acciones, children }: { titulo: string; nota?: string; acciones?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-3 font-michroma text-xs uppercase tracking-etiqueta text-blanco">
            <span aria-hidden className="size-1.5 bg-blanco" />
            {titulo}
          </h2>
          {nota ? <p className="mt-2 max-w-2xl font-lectura text-sm leading-relaxed text-acero">{nota}</p> : null}
        </div>
        {acciones}
      </div>
      {children}
    </section>
  );
}

/** El encabezado de cada sección del panel. */
export function TituloPanel({ titulo, bajada }: { titulo: string; bajada: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="titulo text-[clamp(1.6rem,4vw,2.4rem)] leading-tight text-blanco">{titulo}</h1>
      <p className="max-w-3xl font-lectura text-sm leading-relaxed text-acero md:text-base">{bajada}</p>
    </div>
  );
}
