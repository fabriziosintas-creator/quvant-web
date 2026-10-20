"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type Ref } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SERVICIOS_VISUAL, type IdServicio } from "@/datos/servicios";
import { NOSOTROS } from "@/datos/textos";
import { useVista } from "@/estado/vista";
import { CURVA, DURACION } from "@/componentes/estructura/movimiento";
import { ILUSTRACIONES } from "./IlustracionesServicios";
import { NucleosQuvant } from "./NucleosQuvant";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

type Servicio = (typeof NOSOTROS.servicios.items)[number];

/**
 * La imagen de cada servicio, viva: se mueve sola, cada una a su manera
 * (el tablero se recorre de punta a punta, la foto de la app se acerca, la
 * web de Ferremix se acerca a la marca; ver .mov-* en globals.css) y, con
 * el mouse en cualquier parte de su fila, se inclina hacia él, la foto lo
 * sigue y le pasa un brillo (la fila le pasa --x, --y y data-encima).
 */
function ImagenViva({ id, src, alt, cajaRef }: { id: IdServicio; src: string; alt: string; cajaRef: Ref<HTMLSpanElement> }) {
  return (
    <span ref={cajaRef} className="imagen-viva relative block aspect-[16/10] overflow-hidden rounded-2xl bg-negro">
      <span className="imagen-viva-capa absolute -inset-[4%]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 26rem, (min-width: 768px) 22rem, 100vw"
          className={`mov-${id} object-cover object-top`}
        />
      </span>
      <span aria-hidden className="imagen-viva-brillo pointer-events-none absolute inset-0" />
    </span>
  );
}

/**
 * El título partido en letras para la ola (cada palabra entera, así corta
 * renglón donde corresponde). Los lectores de pantalla leen el texto
 * entero, no las letras sueltas.
 */
function Letras({ texto }: { texto: string }) {
  const palabras = texto.split(" ");
  return (
    <>
      <span className="sr-only">{texto}</span>
      <span aria-hidden>
        {palabras.map((palabra, i) => (
          <Fragment key={`${palabra}-${i}`}>
            <span className="inline-block whitespace-nowrap">
              {Array.from(palabra).map((letra, j) => (
                <span key={j} className="letra inline-block">
                  {letra}
                </span>
              ))}
            </span>
            {i < palabras.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </>
  );
}

/** Lo que hace la fila al pasar el mouse, que no se puede hacer con CSS: la ola del título (GSAP). */
function ola(fila: HTMLElement) {
  if (document.documentElement.dataset.vista === "texto") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const letras = fila.querySelectorAll<HTMLElement>(".letra");
  const acento = getComputedStyle(fila).getPropertyValue("--acento").trim() || "#F26B5B";
  gsap.to(letras, {
    keyframes: { yPercent: [0, -24, 0], color: ["#ECECEE", acento, "#ECECEE"] },
    duration: 0.62,
    ease: CURVA.entrar,
    stagger: 0.017,
    overwrite: true,
  });
}

/**
 * Los tres servicios como filas grandes a todo el ancho, separadas por una
 * línea fina (sin tarjetas: el borde queda para lo que es una ventana): el
 * número enorme, el título y el texto, y al costado la imagen de lo que se
 * ofrece (la pantalla real del sistema, una foto de ambiente, la propuesta
 * real de Ferremix), con su color original. Las tres van iguales (número y
 * línea con el acento, título en blanco): elegir una cambia la ventana de
 * abajo, que dice cuál se está viendo. Cada imagen está viva (ImagenViva).
 *
 * La fila entera reacciona al pasar el mouse (con el foco del teclado, o
 * en el celular al quedar en el medio de la pantalla): el número gira y
 * entra en contorno, el título hace una ola letra por letra, una luz del
 * acento sigue al puntero, la línea se recorre con un destello, aparece
 * "Ver cómo lo armamos ↓", la imagen se inclina hacia el puntero y las
 * otras filas se apagan. Casi todo es CSS (globals.css, .ficha-servicio);
 * la ola, GSAP.
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
        duration: DURACION.media,
        ease: CURVA.entrar,
      })
      .from(
        '[data-pieza="panel"]',
        {
          scaleY: 0,
          opacity: 0,
          transformOrigin: "center bottom",
          duration: DURACION.media,
          stagger: 0.14,
          ease: CURVA.entrar,
        },
        "-=0.1",
      )
      .from(
        '[data-pieza="nodo"]',
        { scale: 0, opacity: 0, duration: DURACION.rapida, stagger: 0.14, ease: CURVA.entrar },
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
    duration: DURACION.media,
    stagger: 0.08,
    ease: CURVA.entrar,
  });
}

export function ServiciosInteractivos() {
  const items = NOSOTROS.servicios.items;
  const [activo, setActivo] = useState<IdServicio>(items[0].id);
  const botones = useRef<Array<HTMLButtonElement | null>>([]);
  const imagenes = useRef<Array<HTMLSpanElement | null>>([]);
  const ventana = useRef<HTMLDivElement>(null);
  const vista = useVista();

  // El mouse sobre la fila: la luz lo sigue y la imagen se inclina hacia él.
  const alMoverFila = (evento: PointerEvent<HTMLButtonElement>, indice: number) => {
    if (evento.pointerType !== "mouse") return;
    const fila = evento.currentTarget.getBoundingClientRect();
    evento.currentTarget.style.setProperty("--mx", `${evento.clientX - fila.left}px`);
    evento.currentTarget.style.setProperty("--my", `${evento.clientY - fila.top}px`);
    const imagen = imagenes.current[indice];
    if (!imagen) return;
    const r = imagen.getBoundingClientRect();
    const limitar = (v: number) => Math.max(-0.5, Math.min(0.5, v));
    imagen.style.setProperty("--x", limitar((evento.clientX - r.left) / r.width - 0.5).toFixed(3));
    imagen.style.setProperty("--y", limitar((evento.clientY - r.top) / r.height - 0.5).toFixed(3));
    imagen.dataset.encima = "si";
  };
  const alSalirFila = (indice: number) => {
    const imagen = imagenes.current[indice];
    if (!imagen) return;
    imagen.style.setProperty("--x", "0");
    imagen.style.setProperty("--y", "0");
    imagen.dataset.encima = "no";
  };

  // En el celular no hay mouse: la ola corre cuando la fila llega al medio de la pantalla.
  useEffect(() => {
    if (vista !== "3d" || !window.matchMedia("(hover: none)").matches) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) if (entrada.isIntersecting) ola(entrada.target as HTMLElement);
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    for (const boton of botones.current) if (boton) observador.observe(boton);
    return () => observador.disconnect();
  }, [vista]);

  const servicio: Servicio = items.find((item) => item.id === activo) ?? items[0];

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

      <div role="tablist" aria-label={NOSOTROS.servicios.etiqueta} data-pausable className="mt-8 border-t border-profundo">
        {items.map((item, indice) => {
          const seleccionado = item.id === activo;
          const visual = SERVICIOS_VISUAL[item.id];
          return (
            <button
              key={item.id}
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
              onPointerEnter={(evento) => evento.pointerType === "mouse" && ola(evento.currentTarget)}
              onPointerMove={(evento) => alMoverFila(evento, indice)}
              onPointerLeave={() => alSalirFila(indice)}
              onFocus={(evento) => evento.currentTarget.matches(":focus-visible") && ola(evento.currentTarget)}
              data-foco-tactil
              className="ficha-servicio group relative grid w-full items-center gap-x-6 gap-y-5 border-b border-profundo py-7 text-left md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] md:gap-x-12 md:py-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]"
            >
              {/* La luz del acento que sigue al puntero. */}
              <span aria-hidden className="foco-servicio pointer-events-none absolute inset-y-0 -inset-x-4 md:-inset-x-8" />
              <span className="relative flex min-w-0 items-start gap-5 md:gap-8">
                {/* El número gira: sale el lleno y entra el de contorno. */}
                <span
                  aria-hidden
                  className="numero-servicio relative inline-block shrink-0 overflow-hidden font-michroma text-[clamp(2.5rem,7vw,5.5rem)] leading-none text-[var(--acento)]"
                >
                  <span className="numero-lleno block">0{indice + 1}</span>
                  <span className="numero-borde absolute inset-0 block">0{indice + 1}</span>
                </span>
                <span className="min-w-0 pt-1">
                  <span className="block titulo text-2xl leading-tight text-blanco md:text-4xl">
                    <Letras texto={item.nombre} />
                  </span>
                  <span className="mt-3 block max-w-xl font-lectura text-[15px] leading-relaxed text-blanco md:text-base">
                    {item.texto}
                  </span>
                  <span
                    aria-hidden
                    className="ver-como mt-4 inline-flex items-center gap-2 font-lectura text-sm font-medium text-[var(--acento)]"
                  >
                    {NOSOTROS.servicios.verComo}
                    <span className="ver-como-flecha inline-block">↓</span>
                  </span>
                </span>
              </span>

              {/* La imagen de lo que se ofrece, con su color original (sin tinte ni blanco y negro: decisión del 19-oct-2026). */}
              <ImagenViva
                id={item.id}
                src={visual.imagen.src}
                alt={visual.imagen.alt}
                cajaRef={(elemento) => {
                  imagenes.current[indice] = elemento;
                }}
              />

              {/* La línea del acento, en las tres: se dibuja de izquierda a derecha al entrar en pantalla. */}
              <span aria-hidden className="linea-servicio absolute -bottom-px left-0 h-[2px] w-full origin-left overflow-hidden bg-[var(--acento)]">
                <span className="linea-destello absolute inset-y-0 left-0 w-1/4" />
              </span>
            </button>
          );
        })}
      </div>

      {/* La ventana: mismo marco que las otras demos del sitio. */}
      <figure
        ref={ventana}
        role="tabpanel"
        id="panel-servicio"
        aria-labelledby={`servicio-${activo}`}
        className="mt-6 overflow-hidden rounded-2xl border border-profundo md:mt-8"
      >
        <figcaption className="flex items-center gap-3 border-b border-profundo px-4 py-2.5">
          <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
          <span className="font-lectura text-sm font-medium text-acero">
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
          <p className="font-plex text-xs text-acero">{servicio.pie}</p>
          {/* Aclaración de honestidad: tiene que leerse, no ser un susurro. */}
          <p className="font-lectura text-sm text-acero">
            {NOSOTROS.servicios.nota}
          </p>
        </div>
      </figure>
    </div>
  );
}
