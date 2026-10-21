import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { TarjetaViva } from "@/componentes/estructura/TarjetaViva";

/**
 * Las piezas de los gráficos del panel, en HTML (sin librería: no pesan,
 * se leen con lector de pantalla y se ven nítidas en el celular).
 *
 * Reglas (guía de visualización + manual): barras finas que crecen desde
 * la misma base, el valor al final de cada barra, los números en Plex Mono
 * tabular. El color entra como en la web (colores.ts, decisión del
 * 14-oct-2026): un acento por rubro o por período, en puntos, bordes,
 * barras y brillos, nunca en el texto de lectura.
 */

const ACERO = "#9C9CA3";

export function PuntoRubro({ acento }: { acento?: string }) {
  return <span aria-hidden className="size-1.5 shrink-0" style={{ background: acento ?? ACERO }} />;
}

/**
 * Una tarjeta con un número grande (los indicadores de arriba). Es la
 * tarjeta viva de la web: se inclina con el mouse y enciende la grilla con
 * el punto que salta (del color del acento); el borde y la línea de abajo
 * se encienden al pasar. Con "medidor" (0 a 1), una barra fina de la
 * proporción (por ejemplo, la conversión).
 */
export function Indicador({ etiqueta, valor, detalle, acento, medidor }: { etiqueta: string; valor: ReactNode; detalle?: ReactNode; acento?: string; medidor?: number }) {
  return (
    <TarjetaViva style={{ "--acento": acento ?? "#ececee" } as CSSProperties} className="group border border-profundo p-4 transition-colors duration-300 hover:border-(--acento)/60 md:p-5">
      <div className="flex min-w-0 flex-col gap-3">
        <p className="flex items-center gap-2 font-plex text-[11px] font-medium uppercase leading-snug tracking-etiqueta text-acero">
          <span aria-hidden className="size-1.5 shrink-0 bg-(--acento) transition-transform duration-300 group-hover:scale-150" />
          {etiqueta}
        </p>
        <p className="font-michroma text-2xl leading-none text-blanco md:text-3xl">{valor}</p>
        {medidor !== undefined ? (
          <span aria-hidden className="block h-1 bg-profundo">
            <span className="barra-crece block h-full bg-(--acento)" style={{ width: `${Math.min(100, Math.max(medidor > 0 ? 2 : 0, medidor * 100))}%` }} />
          </span>
        ) : null}
        {detalle ? <p className="font-plex text-xs text-acero">{detalle}</p> : null}
      </div>
      {/* Pegada al borde de abajo: el contenido está dentro del padding, la línea sale hasta el borde. */}
      <span aria-hidden className="absolute -inset-x-4 -bottom-4 h-px origin-left scale-x-[0.12] md:-inset-x-5 md:-bottom-5 bg-(--acento) transition-transform duration-500 ease-(--ease-quvant) group-hover:scale-x-100" />
    </TarjetaViva>
  );
}

export type FilaBarra = { id: string; etiqueta: string; valor: number; acento?: string; detalle?: string; /** Si lleva a algún lado (por ejemplo, adentro de un nicho). */ href?: string };

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
        {filas.map((fila, i) => {
          const texto = `${fila.etiqueta}: ${formato(fila.valor)}${unidad ? ` ${unidad}` : ""}${fila.detalle ? ` (${fila.detalle})` : ""}`;
          return (
            <li
              key={fila.id}
              title={texto}
              style={{ "--acento": fila.acento ?? "#ececee" } as CSSProperties}
              className="group grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)_auto] items-center gap-3 px-1 py-1.5 transition-colors hover:bg-profundo/40 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto]"
            >
              <span className="flex min-w-0 items-center gap-2 font-plex text-xs text-acero transition-colors group-hover:text-blanco">
                <span aria-hidden className="size-1.5 shrink-0 bg-(--acento) transition-transform duration-300 group-hover:scale-150" />
                {fila.href ? (
                  <Link href={fila.href} className="truncate underline decoration-profundo underline-offset-4 hover:decoration-(--acento)">
                    {fila.etiqueta}
                  </Link>
                ) : (
                  <span className="truncate">{fila.etiqueta}</span>
                )}
              </span>
              <span aria-hidden className="h-2.5 bg-profundo/50">
                {/* Crece al aparecer, una barra detrás de otra; al pasar, brilla. */}
                <span
                  className="barra-crece block h-full bg-(--acento) opacity-80 transition-[opacity,box-shadow] duration-300 group-hover:opacity-100 group-hover:shadow-[0_0_12px_var(--acento)]"
                  style={{ width: `${(fila.valor / maximo) * 100}%`, animationDelay: `${i * 70}ms` }}
                />
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
export function Bloque({ titulo, nota, acciones, id, children }: { titulo: string; nota?: string; acciones?: ReactNode; /** Para llegar directo (las acciones del buscador). */ id?: string; children: ReactNode }) {
  return (
    <section id={id} className="flex min-w-0 scroll-mt-28 flex-col gap-4">
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
