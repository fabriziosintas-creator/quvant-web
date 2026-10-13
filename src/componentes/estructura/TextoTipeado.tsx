"use client";

import { useEffect, useState } from "react";

type Props = {
  texto: string;
  /** Espera antes de empezar a tipear (deja que la Q arranque su armado). */
  retardoMs?: number;
  velocidadMs?: number;
  className?: string;
};

/**
 * Texto que se escribe letra por letra, como una terminal, con el punto
 * cuadrado de la marca como cursor.
 *
 * El texto completo viaja siempre en el HTML del servidor: una copia
 * invisible reserva el espacio exacto (cero salto de diseño) y una copia
 * solo para lectores de pantalla y buscadores lo mantiene legible. La capa
 * tipeada es puro decorado (aria-hidden). Con prefers-reduced-motion se
 * muestra todo de una, sin animación.
 */
export function TextoTipeado({ texto, retardoMs = 600, velocidadMs = 32, className }: Props) {
  const [cantidad, setCantidad] = useState(0);
  const completo = cantidad >= texto.length;

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval> | undefined;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const demora = setTimeout(
      () => {
        if (reducido) {
          setCantidad(texto.length);
          return;
        }
        intervalo = setInterval(() => {
          setCantidad((cuantas) => {
            if (cuantas >= texto.length) {
              clearInterval(intervalo);
              return cuantas;
            }
            return cuantas + 1;
          });
        }, velocidadMs);
      },
      reducido ? 0 : retardoMs,
    );
    return () => {
      clearTimeout(demora);
      if (intervalo) clearInterval(intervalo);
    };
  }, [texto, retardoMs, velocidadMs]);

  return (
    <span className={`relative inline-block ${className ?? ""}`}>
      {/* Fantasma que fija el ancho y alto finales desde el primer render. */}
      <span aria-hidden className="invisible">
        {texto}
      </span>
      <span className="sr-only">{texto}</span>
      <span aria-hidden className="absolute inset-0">
        {texto.slice(0, cantidad)}
        <span
          className={`ml-[0.18em] inline-block size-[0.52em] bg-blanco motion-reduce:hidden ${
            completo ? "animate-[parpadeo_1.1s_steps(2,end)_infinite]" : ""
          }`}
        />
      </span>
    </span>
  );
}
