"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { GrillaYSalto } from "@/componentes/estructura/GrillaYSalto";
import { TarjetaInclinada } from "@/componentes/estructura/TarjetaInclinada";
import { SERVICIOS_VISUAL, type IdServicio } from "@/datos/servicios";
import { NOSOTROS } from "@/datos/textos";
import { useVista } from "@/estado/vista";
import { ILUSTRACIONES } from "./IlustracionesServicios";
import { NucleosQuvant } from "./NucleosQuvant";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

type Servicio = (typeof NOSOTROS.servicios.items)[number];

/**
 * Los tres servicios como pósters: arriba, la imagen de lo que se ofrece
 * (la pantalla real del sistema, una foto de ambiente, la propuesta real
 * de Ferremix) teñida con el acento del servicio; abajo, el título y el
 * texto. La elegida deriva despacio (zoom lento, keyframe `deriva`), su
 * imagen se destiñe menos y una línea del acento la subraya.
 *
 * Debajo, la ventana con la ilustración de cómo se arma cada uno, con un
 * movimiento distinto por servicio: los sistemas encastran, la app crece
 * por fases y la web pasa del amontonamiento al orden.
 */

/** De dónde sale cada bloque de la web antes de acomodarse. */
const DESORDEN = [
  { x: -30, y: 26, sx: 1, sy: 0.5 },
  { x: -46, y: -30, sx: 1, sy: 1 },
  { x: 0, y: 40, sx: 0.45, sy: 1 },
  { x: 52, y: -18, sx: 1, sy: 1 },
  { x: 0, y: 0, sx: 0.3, sy: 1 },
];

function armarLinea(id: Exclude<IdServicio, "sistemas">, linea: gsap.core.Timeline) {
  if (id === "app") {
    linea
      .from('[data-pieza="riel"]', {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 0.4,
        ease: "power2.out",
      })
      .from(
        '[data-pieza="panel"]',
        {
          scaleY: 0,
          opacity: 0,
          transformOrigin: "center bottom",
          duration: 0.42,
          stagger: 0.14,
          ease: "power3.out",
        },
        "-=0.1",
      )
      .from(
        '[data-pieza="nodo"]',
        { scale: 0, opacity: 0, duration: 0.3, stagger: 0.14, ease: "back.out(2)" },
        "<0.08",
      )
      // El punto de la marca recorriendo las fases, de la primera a la última
      // (donde el SVG ya lo tiene dibujado, así que termina en su lugar).
      .fromTo('[data-pieza="viajero"]', { x: -324 }, { x: 0, duration: 1.2, ease: "none" }, 0.35);
    return;
  }

  linea.from('[data-pieza="bloque"]', {
    opacity: 0,
    x: (indice: number) => DESORDEN[indice]?.x ?? 0,
    y: (indice: number) => DESORDEN[indice]?.y ?? 0,
    scaleX: (indice: number) => DESORDEN[indice]?.sx ?? 1,
    scaleY: (indice: number) => DESORDEN[indice]?.sy ?? 1,
    transformOrigin: (indice: number) => (indice === 4 ? "left center" : "50% 50%"),
    duration: 0.65,
    stagger: 0.08,
    ease: "power3.out",
  });
}

export function ServiciosInteractivos() {
  const items = NOSOTROS.servicios.items;
  const [activo, setActivo] = useState<IdServicio>(items[0].id);
  const botones = useRef<Array<HTMLButtonElement | null>>([]);
  const ventana = useRef<HTMLDivElement>(null);
  const vista = useVista();

  const servicio: Servicio = items.find((item) => item.id === activo) ?? items[0];
  const visualActivo = SERVICIOS_VISUAL[activo];

  useGSAP(
    () => {
      // En vista texto la ilustración queda quieta y completa: el SVG ya
      // está dibujado en su estado final y acá solo se anima el "desde".
      // Los sistemas tienen su propia escena (Núcleos Quvant), que se anima sola.
      if (vista !== "3d" || activo === "sistemas") return;
      const linea = gsap.timeline({
        scrollTrigger: { trigger: ventana.current, start: "top 85%" },
      });
      armarLinea(activo, linea);
    },
    { scope: ventana, dependencies: [activo, vista], revertOnUpdate: true },
  );

  /**
   * En el celular las tres tarjetas se apilan y la ventana queda abajo de
   * todo: al elegir un servicio se la acerca, pero solo si no se veía. Si
   * ya estaba a la vista (escritorio), no se mueve nada.
   */
  const alElegir = (id: IdServicio) => {
    setActivo(id);
    requestAnimationFrame(() => {
      const figura = ventana.current;
      if (!figura) return;
      const caja = figura.getBoundingClientRect();
      if (caja.top < window.innerHeight - 120) return;
      figura.scrollIntoView({ behavior: vista === "3d" ? "smooth" : "auto", block: "center" });
    });
  };

  const alTeclear = (evento: KeyboardEvent<HTMLButtonElement>, indice: number) => {
    const ultimo = items.length - 1;
    let destino: number | null = null;
    if (evento.key === "ArrowRight" || evento.key === "ArrowDown")
      destino = indice === ultimo ? 0 : indice + 1;
    if (evento.key === "ArrowLeft" || evento.key === "ArrowUp")
      destino = indice === 0 ? ultimo : indice - 1;
    if (evento.key === "Home") destino = 0;
    if (evento.key === "End") destino = ultimo;
    if (destino === null) return;
    evento.preventDefault();
    setActivo(items[destino].id);
    botones.current[destino]?.focus();
  };

  return (
    <div>
      <p className="font-plex text-xs text-acero">{NOSOTROS.servicios.ayuda}</p>

      <div
        role="tablist"
        aria-label={NOSOTROS.servicios.etiqueta}
        className="mt-8 grid gap-5 md:grid-cols-3 md:gap-6"
      >
        {items.map((item, indice) => {
          const seleccionado = item.id === activo;
          const visual = SERVICIOS_VISUAL[item.id];
          return (
            <TarjetaInclinada
              key={item.id}
              className="h-full"
              style={{ "--acento": visual.color } as CSSProperties}
            >
              <button
                ref={(elemento) => {
                  botones.current[indice] = elemento;
                }}
                type="button"
                role="tab"
                id={`servicio-${item.id}`}
                aria-selected={seleccionado}
                aria-controls="panel-servicio"
                tabIndex={seleccionado ? 0 : -1}
                onClick={() => alElegir(item.id)}
                onKeyDown={(evento) => alTeclear(evento, indice)}
                className={`ficha-servicio group relative flex h-full w-full flex-col overflow-hidden border bg-negro text-left transition-colors ${
                  seleccionado ? "border-[var(--acento)]" : "border-profundo hover:border-acero"
                }`}
              >
                <GrillaYSalto />

                {/* La imagen de lo que se ofrece, teñida con el acento del servicio. */}
                <span className="relative block aspect-[16/10] overflow-hidden border-b border-profundo bg-negro">
                  <Image
                    src={visual.imagen.src}
                    alt={visual.imagen.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className={`foto-servicio object-cover object-top transition-[transform,filter] duration-[1400ms] ease-out group-hover:scale-[1.04] ${
                      seleccionado ? "saturate-100" : "saturate-[0.6]"
                    }`}
                  />
                  <span
                    aria-hidden
                    className={`absolute inset-0 mix-blend-color transition-opacity duration-700 ${
                      seleccionado ? "opacity-25" : "opacity-55"
                    }`}
                    style={{ background: "var(--acento)" }}
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,13,15,0.05)_40%,rgba(13,13,15,0.75))]"
                  />
                  <span className="absolute left-4 top-4 font-michroma text-xs tracking-etiqueta text-blanco">
                    0{indice + 1}
                  </span>
                  <span
                    aria-hidden
                    className={`absolute right-4 top-4 size-1.5 transition-colors ${
                      seleccionado ? "bg-[var(--acento)]" : "bg-blanco/50"
                    }`}
                  />
                </span>

                <span className="relative flex flex-1 flex-col p-6 md:p-7">
                  <span
                    className={`font-plex text-lg font-bold leading-snug transition-colors group-hover:text-blanco ${
                      seleccionado ? "text-blanco" : "text-acero"
                    }`}
                  >
                    {item.nombre}
                  </span>
                  <span className="mt-3 font-lectura text-[15px] leading-relaxed text-acero">
                    {item.texto}
                  </span>
                </span>

                {/* La línea del acento subraya la elegida. */}
                <span
                  aria-hidden
                  className={`absolute bottom-0 left-0 h-[2px] w-full origin-left bg-[var(--acento)] transition-transform duration-700 ease-out ${
                    seleccionado ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            </TarjetaInclinada>
          );
        })}
      </div>

      {/* La ventana: mismo marco que las otras demos del sitio. */}
      <figure
        ref={ventana}
        role="tabpanel"
        id="panel-servicio"
        aria-labelledby={`servicio-${activo}`}
        style={{ "--acento": visualActivo.color } as CSSProperties}
        className="mt-6 overflow-hidden rounded-[8px] border border-profundo md:mt-8"
      >
        <figcaption className="flex items-center gap-3 border-b border-profundo px-4 py-2.5">
          <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
          <span className="font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
            {servicio.ventana}
          </span>
        </figcaption>
        {/* Medida pensada para que la ventana entre en pantalla junto con
            las tarjetas: al elegir un servicio, el dibujo se ve sin bajar. */}
        {activo === "sistemas" ? (
          <NucleosQuvant />
        ) : (
          <div className="bg-negro px-6 py-6 md:px-10 md:py-7">
            <div className="mx-auto max-w-lg">
              {activo === "app" ? <ILUSTRACIONES.app /> : <ILUSTRACIONES.web />}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-profundo px-4 py-2.5">
          <p className="font-plex text-[11px] text-acero">{servicio.pie}</p>
          {/* Aclaración de honestidad: tiene que leerse, no ser un susurro. */}
          <p className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">
            {NOSOTROS.servicios.nota}
          </p>
        </div>
      </figure>
    </div>
  );
}
