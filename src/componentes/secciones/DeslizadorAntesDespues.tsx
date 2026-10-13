"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { ImagenCaso } from "@/datos/casos";

type Props = {
  antes: ImagenCaso;
  despues: ImagenCaso;
  etiquetaAntes: string;
  etiquetaDespues: string;
  ayuda: string;
};

/**
 * Deslizador antes/después: la propuesta se revela arrastrando la línea
 * sobre la captura vieja. Manejable con el dedo, el mouse o el teclado
 * (la manija es un control deslizante accesible).
 */
export function DeslizadorAntesDespues({
  antes,
  despues,
  etiquetaAntes,
  etiquetaDespues,
  ayuda,
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const arrastrando = useRef(false);
  const [porcentaje, setPorcentaje] = useState(50);

  const actualizarDesde = (clientX: number) => {
    const caja = contenedor.current?.getBoundingClientRect();
    if (!caja || caja.width === 0) return;
    const crudo = ((clientX - caja.left) / caja.width) * 100;
    setPorcentaje(Math.min(100, Math.max(0, crudo)));
  };

  const alApretar = (evento: PointerEvent<HTMLDivElement>) => {
    arrastrando.current = true;
    evento.currentTarget.setPointerCapture(evento.pointerId);
    actualizarDesde(evento.clientX);
  };

  const alMover = (evento: PointerEvent<HTMLDivElement>) => {
    if (arrastrando.current) actualizarDesde(evento.clientX);
  };

  const alSoltar = () => {
    arrastrando.current = false;
  };

  const alTeclear = (evento: KeyboardEvent<HTMLButtonElement>) => {
    const paso = evento.shiftKey ? 10 : 2;
    let siguiente: number | null = null;
    if (evento.key === "ArrowLeft" || evento.key === "ArrowDown") siguiente = porcentaje - paso;
    if (evento.key === "ArrowRight" || evento.key === "ArrowUp") siguiente = porcentaje + paso;
    if (evento.key === "Home") siguiente = 0;
    if (evento.key === "End") siguiente = 100;
    if (siguiente === null) return;
    evento.preventDefault();
    setPorcentaje(Math.min(100, Math.max(0, siguiente)));
  };

  return (
    <div
      ref={contenedor}
      onPointerDown={alApretar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
      className="relative select-none overflow-hidden rounded-[8px] border border-profundo touch-pan-y"
      style={{ aspectRatio: `${antes.ancho} / ${antes.alto}` }}
    >
      <Image
        src={antes.src}
        alt={antes.alt}
        fill
        sizes="(min-width: 1152px) 1088px, 100vw"
        className="pointer-events-none object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - porcentaje}% 0 0)` }}
      >
        <Image
          src={despues.src}
          alt={despues.alt}
          fill
          sizes="(min-width: 1152px) 1088px, 100vw"
          className="pointer-events-none object-cover"
        />
      </div>

      <span className="pointer-events-none absolute left-3 top-3 border border-profundo bg-negro/80 px-2 py-1 font-plex text-[10px] font-medium uppercase tracking-etiqueta text-acero">
        {etiquetaAntes}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 border border-profundo bg-negro/80 px-2 py-1 font-plex text-[10px] font-medium uppercase tracking-etiqueta text-blanco">
        {etiquetaDespues}
      </span>

      {/* La línea divisoria y su manija deslizable. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-px bg-blanco"
        style={{ left: `${porcentaje}%` }}
      />
      <button
        type="button"
        role="slider"
        aria-label={ayuda}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(porcentaje)}
        onKeyDown={alTeclear}
        className="absolute top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1.5 border border-blanco bg-negro/85"
        style={{ left: `${porcentaje}%` }}
      >
        <span aria-hidden className="size-1 bg-blanco" />
        <span aria-hidden className="size-1 bg-blanco" />
      </button>
    </div>
  );
}
