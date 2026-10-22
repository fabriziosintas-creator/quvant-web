"use client";

import { useEffect, useState } from "react";
import { PROMO_TEXTOS } from "@/datos/promo";
import { EVENTO_REPRODUCIR } from "./VideoPromo";

const T = PROMO_TEXTOS.irAlVideo;

/**
 * "Deslizá y mirá el video": una píldora de vidrio que flota abajo al
 * centro, con flechas que caen en cascada. Se ve mientras el video
 * todavía está más abajo y se va sola cuando entra en pantalla (o si ya
 * se pasó de largo). Tocarla baja hasta el video y lo hace arrancar (el
 * toque deja que suene). En el celular va arriba de la barra de canales.
 * Lo visual vive en globals.css (.ir-al-video).
 */
export function IrAlVideo() {
  const [oculto, setOculto] = useState(false);

  // Se ve solo mientras el video está más abajo de la pantalla. Se mide en cada scroll (con
  // requestAnimationFrame) y no con IntersectionObserver: si el scroll salta el video de una vez,
  // el observador no se entera (nunca hubo intersección) y la píldora quedaba flotando de más.
  useEffect(() => {
    const video = document.getElementById("video");
    if (!video) return;
    let cuadro = 0;
    const medir = () => {
      cuadro = 0;
      setOculto(video.getBoundingClientRect().top < window.innerHeight * 0.7);
    };
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENTO_REPRODUCIR))}
      data-oculto={oculto ? "si" : undefined}
      aria-hidden={oculto || undefined}
      tabIndex={oculto ? -1 : undefined}
      className="ir-al-video"
    >
      <span aria-hidden className="ir-al-video__flechas">
        <span />
        <span />
        <span />
      </span>
      <span className="font-lectura text-sm font-medium text-blanco">{T.texto}</span>
      <span className="ir-al-video__duracion font-plex text-[10px] uppercase tracking-etiqueta">{T.duracion}</span>
    </button>
  );
}
