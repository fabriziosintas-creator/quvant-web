"use client";

import { useRef, useState } from "react";
import { NOSOTROS } from "@/datos/textos";

const { spot } = NOSOTROS;

/**
 * El spot de Quvant (42 s, con música), en una ventana como la de Forja.
 * No se descarga hasta que la persona toca "Ver el video" (preload="none"):
 * ahí arranca con sonido y aparecen los controles del navegador. Como lo
 * pide la persona, corre igual en vista texto o con "menos movimiento".
 *
 * Sale de video/ (npm run render-2026 y npm run entregas-2026): VP9 con
 * Opus primero y H.264 con AAC para los navegadores sin VP9.
 */
export function SpotQuvant() {
  const video = useRef<HTMLVideoElement>(null);
  const [empezado, setEmpezado] = useState(false);

  const empezar = () => {
    setEmpezado(true);
    video.current?.play().catch(() => {});
  };

  return (
    <figure data-revelar className="overflow-hidden rounded-[10px] border border-profundo">
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-profundo px-4 py-2.5">
        <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
        <span className="font-plex text-[11px] font-medium uppercase tracking-etiqueta text-blanco">
          {spot.ventana}
        </span>
        <span className="ml-auto font-plex text-[11px] uppercase tracking-etiqueta text-acero">
          {spot.nota}
        </span>
      </figcaption>
      <div className="relative aspect-video bg-negro">
        <video
          ref={video}
          className="absolute inset-0 size-full"
          poster="/spot/spot-poster.webp"
          preload="none"
          playsInline
          controls={empezado}
          aria-label={spot.descripcion}
        >
          <source src="/spot/spot-1080.webm" type='video/webm; codecs="vp9, opus"' />
          <source src="/spot/spot-1080.mp4" type="video/mp4" />
        </video>
        {empezado ? null : (
          <button
            type="button"
            onClick={empezar}
            className="group absolute inset-0 flex items-end justify-start p-4 focus-visible:outline-none md:p-8"
          >
            <span className="flex items-center gap-3 border border-profundo bg-negro/85 px-4 py-3 transition-colors group-hover:border-acero group-focus-visible:border-blanco">
              <svg aria-hidden viewBox="0 0 12 12" className="size-3 fill-blanco">
                <path d="M3 1.5 10.5 6 3 10.5Z" />
              </svg>
              <span className="font-plex text-[13px] font-medium uppercase tracking-[0.14em] text-blanco">
                {spot.reproducir}
              </span>
              <span className="font-plex text-[13px] text-acero">{spot.duracion}</span>
            </span>
          </button>
        )}
      </div>
    </figure>
  );
}
