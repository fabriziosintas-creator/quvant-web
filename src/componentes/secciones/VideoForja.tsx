"use client";

import { useEffect, useRef, useState } from "react";
import { PLATAFORMAS } from "@/datos/textos";
import { usePrefiereQuieto } from "@/estado/quieto";
import { useVista } from "@/estado/vista";

const { forja } = PLATAFORMAS;

/**
 * La ventana de Forja: un recorrido real grabado en la demo pública
 * (la red de sucursales, la entrada en 3D, los faltantes, los críticos y
 * la sala de control), editado en Remotion.
 *
 * El video no se descarga hasta que hace falta (preload="none") y solo
 * corre en vista 3D, con el panel de Industria elegido y la ventana en
 * pantalla. En vista texto o con "menos movimiento" queda quieto en su
 * póster y se reproduce solo si la persona lo pide.
 */
export function VideoForja({ activo = true }: { activo?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [aLaVista, setALaVista] = useState(false);
  const [enPausa, setEnPausa] = useState(false);
  const [reproduciendo, setReproduciendo] = useState(false);
  const vista = useVista();
  const quieto = usePrefiereQuieto();
  const automatico = vista === "3d" && !quieto;

  useEffect(() => {
    const elemento = video.current;
    if (!elemento) return;
    const observador = new IntersectionObserver(([e]) => setALaVista(e.isIntersecting), {
      threshold: 0.25,
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const elemento = video.current;
    if (!elemento) return;
    if (!activo || !aLaVista) elemento.pause();
    else if (automatico) {
      // Si el navegador no deja arrancar solo, queda el botón.
      if (enPausa) elemento.pause();
      else elemento.play().catch(() => {});
    }
  }, [automatico, activo, aLaVista, enPausa]);

  // Al pasar a vista texto (o a "menos movimiento") se detiene.
  useEffect(() => {
    if (!automatico) video.current?.pause();
  }, [automatico]);

  const alternar = () => {
    const elemento = video.current;
    if (!elemento) return;
    if (elemento.paused) {
      setEnPausa(false);
      elemento.play().catch(() => {});
    } else {
      setEnPausa(true);
      elemento.pause();
    }
  };

  return (
    <figure className="overflow-hidden rounded-[8px] border border-profundo">
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-profundo px-4 py-2.5">
        <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
        <span className="font-plex text-[11px] font-medium uppercase tracking-etiqueta text-blanco">
          {forja.ventana}
        </span>
        <span className="ml-auto font-plex text-[10px] uppercase tracking-etiqueta text-acero">
          {forja.nota}
        </span>
      </figcaption>
      <div className="relative aspect-[16/10] bg-negro">
        <video
          ref={video}
          className="absolute inset-0 size-full object-cover"
          poster="/forja/forja-poster.webp"
          muted
          loop
          playsInline
          preload="none"
          aria-label={forja.descripcion}
          onPlay={() => setReproduciendo(true)}
          onPause={() => setReproduciendo(false)}
        >
          {/* El MP4 primero: con esta imagen (interfaz oscura y quieta) pesa menos que el WebM. */}
          <source src="/forja/forja-recorrido.mp4" type="video/mp4" />
          <source src="/forja/forja-recorrido.webm" type="video/webm" />
        </video>
        <button
          type="button"
          onClick={alternar}
          aria-label={reproduciendo ? forja.pausar : forja.reproducir}
          className="absolute bottom-3 left-3 flex size-9 items-center justify-center rounded-full border border-profundo bg-negro/80 text-blanco transition-colors hover:border-acero focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blanco md:size-10"
        >
          {reproduciendo ? (
            <svg aria-hidden viewBox="0 0 12 12" className="size-3 fill-current">
              <rect x="2" y="1.5" width="3" height="9" />
              <rect x="7" y="1.5" width="3" height="9" />
            </svg>
          ) : (
            <svg aria-hidden viewBox="0 0 12 12" className="size-3 fill-current">
              <path d="M3 1.5 10.5 6 3 10.5Z" />
            </svg>
          )}
        </button>
      </div>
    </figure>
  );
}
