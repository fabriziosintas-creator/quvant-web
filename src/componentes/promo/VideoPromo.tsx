"use client";

import { useEffect, useRef, useState } from "react";
import { medir } from "@/componentes/medicion/medir";
import { VIDEO_PROMO, type IdSituacion } from "@/datos/promo";

/**
 * El video de la promo, con un botón por capítulo (la parte interactiva:
 * cada uno salta a su situación). Sin video cargado (VIDEO_PROMO.archivo
 * null) no se dibuja nada. Con subtítulos siempre, sin reproducción
 * automática y sin cargar nada hasta que se toca (preload "none").
 *
 * Los botones "Ver en el video" de cada situación lo llaman con el evento
 * "promo:capitulo".
 */
export const EVENTO_CAPITULO = "promo:capitulo";

export function VideoPromo() {
  const video = useRef<HTMLVideoElement>(null);
  const marco = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState<IdSituacion>(VIDEO_PROMO.capitulos[0].id);

  const ir = (id: IdSituacion, desplazar = false) => {
    const capitulo = VIDEO_PROMO.capitulos.find((c) => c.id === id);
    const v = video.current;
    if (!capitulo || !v) return;
    setActual(id);
    v.currentTime = capitulo.desde;
    void v.play().catch(() => {});
    medir("play_video_promo", null, `/primeros-100/video/${id}`);
    if (desplazar) marco.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    const alPedir = (evento: Event) => ir((evento as CustomEvent<IdSituacion>).detail, true);
    window.addEventListener(EVENTO_CAPITULO, alPedir);
    return () => window.removeEventListener(EVENTO_CAPITULO, alPedir);
  });

  if (!VIDEO_PROMO.archivo) return null;

  const alAvanzar = () => {
    const t = video.current?.currentTime ?? 0;
    const capitulo = [...VIDEO_PROMO.capitulos].reverse().find((c) => t >= c.desde);
    if (capitulo && capitulo.id !== actual) setActual(capitulo.id);
  };

  return (
    <div ref={marco} className="flex flex-col gap-4">
      <div role="group" aria-label="Capítulos del video" className="flex flex-wrap gap-2">
        {VIDEO_PROMO.capitulos.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => ir(c.id)}
            aria-pressed={c.id === actual}
            className="rounded-full inline-flex h-10 items-center gap-2 border border-profundo px-4 font-lectura text-sm text-acero transition-colors hover:text-blanco aria-pressed:border-blanco aria-pressed:text-blanco"
          >
            <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
            {c.titulo}
          </button>
        ))}
      </div>
      <div className="pantalla overflow-hidden">
        <video
          ref={video}
          controls
          playsInline
          preload="none"
          poster={VIDEO_PROMO.poster ?? undefined}
          onTimeUpdate={alAvanzar}
          onPlay={() => medir("play_video_promo", null, `/primeros-100/video/${actual}`)}
          className="block aspect-video w-full bg-negro"
        >
          {VIDEO_PROMO.archivoWebm ? <source src={VIDEO_PROMO.archivoWebm} type="video/webm" /> : null}
          <source src={VIDEO_PROMO.archivo} type="video/mp4" />
          {VIDEO_PROMO.subtitulos ? <track kind="captions" src={VIDEO_PROMO.subtitulos} srcLang="es" label="Español" default /> : null}
        </video>
      </div>
    </div>
  );
}

/** "Ver en el video", al pie de cada situación (solo si hay video). */
export function VerEnVideo({ id }: { id: IdSituacion }) {
  if (!VIDEO_PROMO.archivo) return null;
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(EVENTO_CAPITULO, { detail: id }))}
      className="self-start font-lectura text-sm text-blanco underline decoration-profundo underline-offset-4 hover:decoration-blanco"
    >
      Ver en el video
    </button>
  );
}
