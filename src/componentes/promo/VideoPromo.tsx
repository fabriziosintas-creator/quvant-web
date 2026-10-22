"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, ViewTransition } from "react";
import { CLASE_BOTON } from "@/componentes/cuenta/estilos";
import { medir } from "@/componentes/medicion/medir";
import { PROMO_TEXTOS, VIDEO_PROMO, type IdSituacion } from "@/datos/promo";
import { BotonLugar } from "./BotonLugar";

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

/** El capítulo que corresponde a un segundo del video. */
const capituloEn = (t: number) => [...VIDEO_PROMO.capitulos].reverse().find((c) => t >= c.desde) ?? VIDEO_PROMO.capitulos[0];

/**
 * Al terminar, el video ofrece el paso siguiente: el registro con la
 * promo (o crear la cuenta, si todavía no arrancó). `cta` lo arma la
 * página, que sabe en qué estado está la promo.
 *
 * Si se llega con #video (el botón de la portada), queda a la vista y
 * arranca solo: el toque en la portada cuenta como gesto de la persona,
 * así que el navegador lo deja sonar. Si igual lo bloquea, arranca mudo.
 */
export function VideoPromo({ cta }: { cta?: { texto: string; antes: boolean } }) {
  const video = useRef<HTMLVideoElement>(null);
  const marco = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState<IdSituacion>(VIDEO_PROMO.capitulos[0].id);
  const [terminado, setTerminado] = useState(false);

  // Llegó desde el botón de la portada: el video queda en el centro de la pantalla. Va en un
  // efecto de layout (dentro del mismo commit de la navegación) para que la transición
  // "portal-promo" ya lo encuentre ahí; se repite por si algo más movió el scroll después.
  useLayoutEffect(() => {
    if (window.location.hash !== "#video") return;
    const ubicar = () => marco.current?.scrollIntoView({ block: "center", behavior: "instant" });
    ubicar();
    const cuadro = requestAnimationFrame(ubicar);
    const despues = window.setTimeout(ubicar, 350);
    return () => {
      cancelAnimationFrame(cuadro);
      window.clearTimeout(despues);
    };
  }, []);

  // Y arranca solo.
  useEffect(() => {
    const v = video.current;
    if (!v || window.location.hash !== "#video") return;
    v.preload = "auto";
    v.play().catch(() => {
      v.muted = true;
      void v.play().catch(() => {});
    });
  }, []);

  const verDeNuevo = () => {
    const v = video.current;
    if (!v) return;
    setTerminado(false);
    v.currentTime = 0;
    void v.play().catch(() => {});
  };

  const ir = (id: IdSituacion, desplazar = false) => {
    const capitulo = VIDEO_PROMO.capitulos.find((c) => c.id === id);
    const v = video.current;
    if (!capitulo || !v) return;
    setActual(id);
    const yaSeVeia = !v.paused;
    v.currentTime = capitulo.desde;
    void v.play().catch(() => {});
    // Si ya se estaba viendo no hay evento "play": se anota acá. Si no, lo anota onPlay (una sola vez).
    if (yaSeVeia) medir("play_video_promo", null, id);
    if (desplazar) marco.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    const alPedir = (evento: Event) => ir((evento as CustomEvent<IdSituacion>).detail, true);
    window.addEventListener(EVENTO_CAPITULO, alPedir);
    return () => window.removeEventListener(EVENTO_CAPITULO, alPedir);
  });

  if (!VIDEO_PROMO.archivo) return null;

  const alAvanzar = () => {
    const capitulo = capituloEn(video.current?.currentTime ?? 0);
    if (capitulo.id !== actual) setActual(capitulo.id);
  };

  return (
    <div ref={marco} id="video" className="flex scroll-mt-24 flex-col gap-4">
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
      {/* El mismo nombre que el botón de la portada: la cápsula se convierte en este marco. */}
      <ViewTransition name="portal-promo" share="portal-promo" default="none">
        <div className="pantalla relative overflow-hidden">
          <video
            ref={video}
            controls
            playsInline
            preload="none"
            poster={VIDEO_PROMO.poster ?? undefined}
            onTimeUpdate={alAvanzar}
            onPlay={() => {
              setTerminado(false);
              medir("play_video_promo", null, capituloEn(video.current?.currentTime ?? 0).id);
            }}
            onEnded={() => setTerminado(true)}
            className="block aspect-video w-full bg-negro"
          >
            {VIDEO_PROMO.archivoWebm ? <source src={VIDEO_PROMO.archivoWebm} type="video/webm" /> : null}
            <source src={VIDEO_PROMO.archivo} type="video/mp4" />
            {VIDEO_PROMO.subtitulos ? <track kind="captions" src={VIDEO_PROMO.subtitulos} srcLang="es" label="Español" default /> : null}
          </video>
          {terminado && cta ? (
            <div className="fin-video absolute inset-0 flex flex-col items-start justify-center gap-3 bg-negro/80 p-4 backdrop-blur-sm sm:gap-4 sm:p-6 md:gap-5 md:p-10">
              <p className="titulo text-xl leading-tight text-blanco sm:text-2xl md:text-4xl">{PROMO_TEXTOS.finVideo.titulo}</p>
              {/* En el celular el video es bajito: va solo el título y los botones. */}
              <p className="hidden max-w-lg font-lectura text-sm leading-relaxed text-acero sm:block md:text-base">
                {cta.antes ? PROMO_TEXTOS.finVideo.textoAntes : PROMO_TEXTOS.finVideo.texto}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {cta.antes ? (
                  <Link href="/registro?origen=primeros-100" className={CLASE_BOTON}>
                    <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
                    {cta.texto}
                  </Link>
                ) : (
                  <BotonLugar className={CLASE_BOTON}>
                    <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
                    {cta.texto}
                  </BotonLugar>
                )}
                <button type="button" onClick={verDeNuevo} className="font-lectura text-sm font-medium text-acero underline decoration-profundo underline-offset-4 transition-colors hover:text-blanco hover:decoration-blanco">
                  {PROMO_TEXTOS.finVideo.otraVez}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </ViewTransition>
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
