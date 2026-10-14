"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { NOSOTROS } from "@/datos/textos";
import { useVista } from "@/estado/vista";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/**
 * Las dos fuerzas que se juntan con el scroll: desarrollo desde la
 * izquierda, comercial desde la derecha, y al encontrarse aparece
 * "= QUVANT". Atado al avance del scroll (scrub), no a un disparo.
 * Solo anima en vista 3D (que ya respeta prefers-reduced-motion); en
 * el celular las tarjetas suben en vez de cruzarse.
 */
export function FuerzasQueSeJuntan() {
  const raiz = useRef<HTMLDivElement>(null);
  const vista = useVista();

  useGSAP(
    () => {
      if (vista !== "3d") return;
      const mm = gsap.matchMedia();
      mm.add(
        {
          animable: "(prefers-reduced-motion: no-preference)",
          ancho: "(min-width: 768px)",
        },
        (contexto) => {
          const condiciones = contexto.conditions as
            | { animable: boolean; ancho: boolean }
            | undefined;
          if (!condiciones?.animable) return;
          const linea = gsap.timeline({
            scrollTrigger: {
              trigger: raiz.current,
              start: "top 80%",
              end: "center 42%",
              scrub: 1,
            },
          });
          if (condiciones.ancho) {
            linea
              .from('[data-fuerza="izquierda"]', { xPercent: -24, opacity: 0, ease: "none" }, 0)
              .from('[data-fuerza="derecha"]', { xPercent: 24, opacity: 0, ease: "none" }, 0);
          } else {
            linea
              .from('[data-fuerza="izquierda"]', { y: 36, opacity: 0, ease: "none" }, 0)
              .from('[data-fuerza="derecha"]', { y: 36, opacity: 0, ease: "none" }, 0.15);
          }
          linea.from(
            '[data-fuerza="resultado"]',
            { opacity: 0, y: 18, scale: 0.95, ease: "none" },
            0.55,
          );
        },
      );
    },
    // Al cambiar la vista se revierte todo: en vista texto el contenido
    // queda quieto y completo, sin estados a medio animar.
    { scope: raiz, dependencies: [vista], revertOnUpdate: true },
  );

  return (
    <div ref={raiz} className="mt-16 md:mt-24">
      <div className="grid gap-5 md:grid-cols-2 md:gap-8">
        <div data-fuerza="izquierda" className="border border-profundo p-7 md:p-9">
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {NOSOTROS.fuerzas.desarrollo.etiqueta}
          </p>
          <p className="mt-4 font-plex text-base leading-relaxed text-blanco md:text-lg">
            {NOSOTROS.fuerzas.desarrollo.texto}
          </p>
        </div>
        <div data-fuerza="derecha" className="border border-profundo p-7 md:p-9">
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {NOSOTROS.fuerzas.comercial.etiqueta}
          </p>
          <p className="mt-4 font-plex text-base leading-relaxed text-blanco md:text-lg">
            {NOSOTROS.fuerzas.comercial.texto}
          </p>
        </div>
      </div>
      <p data-fuerza="resultado" className="mt-10 text-center md:mt-12">
        <span className="mr-4 font-plex text-lg text-acero">=</span>
        <span className="font-michroma text-2xl tracking-marca text-blanco md:text-4xl">
          {NOSOTROS.fuerzas.resultado}
        </span>
      </p>
    </div>
  );
}
