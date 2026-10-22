"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PROMO_TEXTOS } from "@/datos/promo";
import { useVista } from "@/estado/vista";
import { avanceRegalo } from "./avanceRegalo";

const QRegalo = dynamic(() => import("./QRegalo"), { ssr: false });

const T = PROMO_TEXTOS.regalo;
const CONSULTA_3D = "(min-width: 768px)";

function suscribirAncho(aviso: () => void) {
  const consulta = window.matchMedia(CONSULTA_3D);
  consulta.addEventListener("change", aviso);
  return () => consulta.removeEventListener("change", aviso);
}

/**
 * La invitación a bajar hasta "lo que te regalamos": la Q de la marca,
 * que gira mientras se scrollea y suelta su punto cuadrado, que cae hacia
 * los beneficios. En computadora (vista 3D, equipo no liviano) es la Q de
 * cromo en WebGL (QRegalo), que se carga recién cuando la sección se
 * acerca y dibuja solo mientras se ve; en el celular o en vista texto, la
 * Q en SVG con la misma idea, animada por el scroll solo con CSS
 * (animation-timeline: view(), .q-regalo en globals.css).
 * El botón baja hasta los beneficios.
 */
export function InvitacionRegalo({ destino = "beneficios" }: { destino?: string }) {
  const seccion = useRef<HTMLElement>(null);
  const vista = useVista();
  const ancha = useSyncExternalStore(
    suscribirAncho,
    () => window.matchMedia(CONSULTA_3D).matches && document.documentElement.dataset.liviano !== "si",
    () => false,
  );
  const con3d = vista === "3d" && ancha;
  const [cerca, setCerca] = useState(false);
  const [aLaVista, setALaVista] = useState(false);

  // Se arma cuando se acerca; dibuja solo mientras se ve.
  useEffect(() => {
    const el = seccion.current;
    if (!el || !con3d) return;
    const llegando = new IntersectionObserver(([e]) => e.isIntersecting && setCerca(true), { rootMargin: "700px 0px" });
    const viendo = new IntersectionObserver(([e]) => setALaVista(e.isIntersecting));
    llegando.observe(el);
    viendo.observe(el);
    return () => {
      llegando.disconnect();
      viendo.disconnect();
    };
  }, [con3d]);

  // Cuánto se avanzó por la sección (0 cuando asoma abajo, 1 cuando se va arriba), para la Q 3D.
  useEffect(() => {
    if (!con3d) return;
    let cuadro = 0;
    const medir = () => {
      cuadro = 0;
      const el = seccion.current;
      if (!el) return;
      const caja = el.getBoundingClientRect();
      const alto = window.innerHeight;
      avanceRegalo.valor = Math.min(1, Math.max(0, (alto - caja.top) / (alto + caja.height * 0.6)));
    };
    const alScrollear = () => {
      if (!cuadro) cuadro = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", alScrollear, { passive: true });
    window.addEventListener("resize", alScrollear);
    return () => {
      window.removeEventListener("scroll", alScrollear);
      window.removeEventListener("resize", alScrollear);
      cancelAnimationFrame(cuadro);
    };
  }, [con3d]);

  const ir = () => document.getElementById(destino)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section ref={seccion} aria-labelledby="regalo-titulo" className="invitacion-regalo contenedor relative flex flex-col items-center pb-8 pt-4 text-center md:pb-12">
      <div aria-hidden className="invitacion-regalo__escena relative h-[260px] w-[220px] md:h-[360px] md:w-[300px]">
        <div className="invitacion-regalo__halo absolute inset-[18%] rounded-full" />
        {con3d ? (
          cerca ? <QRegalo activo={aLaVista} /> : null
        ) : vista !== "decidiendo" ? (
          <svg viewBox="0 0 105 160" className="q-regalo relative size-full overflow-visible p-6">
            <defs>
              <linearGradient id="q-regalo-cromo" gradientUnits="userSpaceOnUse" x1="8" y1="20" x2="97" y2="85">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="0.3333" stopColor="#3A3D42" />
                <stop offset="0.5" stopColor="#F2F4F6" />
                <stop offset="0.6667" stopColor="#6C7076" />
                <stop offset="1" stopColor="#9DA1A7" />
              </linearGradient>
            </defs>
            <g className="q-regalo__cuerpo">
              <circle cx="44" cy="44" r="31" fill="none" stroke="url(#q-regalo-cromo)" strokeWidth="10" />
              <line x1="63" y1="63" x2="80" y2="80" stroke="url(#q-regalo-cromo)" strokeWidth="10" />
            </g>
            <rect className="q-regalo__punto" x="86" y="86" width="11" height="11" fill="#7BD389" />
          </svg>
        ) : null}
      </div>
      <p className="font-lectura text-sm font-medium text-acero">{T.etiqueta}</p>
      <h2 id="regalo-titulo" className="mt-3 max-w-2xl titulo text-[clamp(1.9rem,5vw,3.25rem)] leading-[1.08] text-blanco">
        {T.titulo}
      </h2>
      <p className="mt-4 max-w-xl font-lectura text-base leading-relaxed text-acero md:text-lg">{T.texto}</p>
      <button type="button" onClick={ir} className="ir-al-video mt-8" data-en-linea>
        <span aria-hidden className="ir-al-video__flechas">
          <span />
          <span />
          <span />
        </span>
        <span className="font-lectura text-sm font-medium text-blanco">{T.boton}</span>
      </button>
    </section>
  );
}
