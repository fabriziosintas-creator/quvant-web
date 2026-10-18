"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { OBJETIVO_VISUAL, type IdEtapa } from "@/datos/objetivo";
import { OBJETIVO } from "@/datos/textos";
import { useVista } from "@/estado/vista";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * El recorrido de "Nuestro objetivo", atado al scroll.
 *
 * La sección se queda fija mientras el visitante baja (tres pantallas
 * de scroll) y el tiempo lo maneja el scroll: la línea se dibuja de nodo
 * en nodo cambiando de color, el punto cuadrado de la marca salta de una
 * etapa a la siguiente (se vuelve redondo en el aire y cae cuadrado, como
 * en el manual), y en cada etapa cambian el titular, el comentario, la
 * foto y el resplandor del fondo. Los cuatro textos están en el HTML
 * siempre: lo que cambia es cuál se ve.
 *
 * En vista texto no hay fijación ni recorrido: las etapas se apilan.
 */

const ETAPAS = OBJETIVO.etapas;
const CANTIDAD = ETAPAS.length;

const GRILLA = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><rect width="2" height="2" fill="#26262B"/></svg>',
)}")`;

function colorDe(id: IdEtapa) {
  return OBJETIVO_VISUAL[id].color;
}

export function RecorridoObjetivo() {
  const vista = useVista();
  const exterior = useRef<HTMLDivElement>(null);
  const linea = useRef<HTMLDivElement>(null);
  const salto = useRef<HTMLDivElement>(null);
  const nodos = useRef<Array<HTMLButtonElement | null>>([]);
  const [activa, setActiva] = useState(0);
  const activaRef = useRef(0);

  useEffect(() => {
    const contenedor = exterior.current;
    if (vista !== "3d" || !contenedor) return;

    const aplicar = (progreso: number) => {
      const t = progreso * (CANTIDAD - 1);
      const indice = Math.round(t);
      if (linea.current) linea.current.style.transform = `scaleX(${progreso})`;
      if (salto.current) {
        // El salto: entre nodo y nodo describe un arco, se redondea en el
        // aire y da media vuelta; aterriza cuadrado, como el punto del logo.
        const fraccion = t - Math.floor(t);
        const arco = Math.sin(fraccion * Math.PI);
        salto.current.style.left = `${progreso * 100}%`;
        salto.current.style.transform = `translate(-50%, calc(-50% - ${arco * 34}px)) rotate(${arco * 90}deg)`;
        salto.current.style.borderRadius = `${arco * 50}%`;
      }
      nodos.current.forEach((nodo, i) => {
        nodo?.setAttribute("data-estado", t >= i - 0.5 ? "pasado" : "pendiente");
      });
      if (indice !== activaRef.current) {
        activaRef.current = indice;
        setActiva(indice);
      }
    };

    const disparador = ScrollTrigger.create({
      trigger: contenedor,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => aplicar(self.progress),
    });
    aplicar(disparador.progress);
    return () => disparador.kill();
  }, [vista]);

  const irA = (indice: number) => {
    const contenedor = exterior.current;
    if (!contenedor) return;
    const alto = contenedor.offsetHeight - window.innerHeight;
    window.scrollTo({ top: contenedor.offsetTop + (indice / (CANTIDAD - 1)) * alto, behavior: "auto" });
  };

  const etapaActiva = ETAPAS[activa];
  const color = colorDe(etapaActiva.id);

  // Vista texto: sin fijación, las etapas una debajo de la otra.
  if (vista === "texto") {
    return (
      <div className="contenedor py-24 md:py-32">
        <Cabecera />
        <ol className="mt-12 grid gap-6 md:grid-cols-2">
          {ETAPAS.map((etapa, i) => (
            <li
              key={etapa.id}
              className="border border-profundo p-6"
              style={{ "--acento": colorDe(etapa.id) } as CSSProperties}
            >
              <p className="font-michroma text-xs uppercase tracking-etiqueta text-[var(--acento)]">
                0{i + 1} · {etapa.nombre}
              </p>
              <h3 className="mt-3 font-plex text-xl font-bold text-blanco">{etapa.titular}</h3>
              <p className="mt-3 font-lectura text-[15px] leading-relaxed text-acero">{etapa.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div ref={exterior} className="relative" style={{ height: `${CANTIDAD * 75}svh` }}>
      <div
        className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden pt-16 md:pt-20"
        style={{ "--acento": color } as CSSProperties}
      >
        {/* El fondo: la grilla de puntos y un resplandor del color de la etapa. */}
        <div aria-hidden className="absolute inset-0 opacity-60" style={{ backgroundImage: GRILLA }} />
        <div
          aria-hidden
          className="absolute inset-0 transition-[background] duration-1000"
          style={{
            background: `radial-gradient(ellipse 55% 60% at 72% 62%, ${color}26 0%, transparent 70%)`,
          }}
        />

        <div className="contenedor relative">
          <Cabecera />

          {/* La línea y los nodos. */}
          <div className="relative mt-6 h-14 md:mt-8">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-profundo" />
            <div
              ref={linea}
              className="absolute left-0 right-0 top-1/2 h-px origin-left"
              style={{
                transform: "scaleX(0)",
                background: `linear-gradient(90deg, ${ETAPAS.map((e) => colorDe(e.id)).join(", ")})`,
              }}
            />
            {ETAPAS.map((etapa, i) => (
              <button
                key={etapa.id}
                ref={(el) => {
                  nodos.current[i] = el;
                }}
                type="button"
                data-estado={i === 0 ? "pasado" : "pendiente"}
                aria-current={i === activa ? "step" : undefined}
                aria-label={`Ir a la etapa ${i + 1}: ${etapa.nombre}`}
                onClick={() => irA(i)}
                style={{ left: `${(i / (CANTIDAD - 1)) * 100}%`, "--nodo": colorDe(etapa.id) } as CSSProperties}
                className="nodo-objetivo absolute top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-negro font-plex text-[11px] font-medium transition-colors duration-500 data-[estado=pasado]:border-[var(--nodo)] data-[estado=pasado]:text-[var(--nodo)] data-[estado=pendiente]:border-profundo data-[estado=pendiente]:text-acero md:size-9 md:text-xs"
              >
                {i + 1}
                {/* En celular solo se nombra la etapa activa, en su color; las
                    de las puntas se alinean hacia adentro para no cortarse. */}
                <span
                  className={`pointer-events-none absolute top-full mt-2 whitespace-nowrap font-plex text-[10px] uppercase tracking-etiqueta text-acero sm:block ${
                    i === activa ? "max-sm:text-[var(--nodo)]" : "hidden"
                  } ${i === 0 ? "max-sm:left-0" : ""} ${i === CANTIDAD - 1 ? "max-sm:right-0" : ""}`}
                >
                  {etapa.nombre}
                </span>
              </button>
            ))}
            {/* El punto que salta de etapa en etapa. */}
            <div
              ref={salto}
              aria-hidden
              className="absolute top-1/2 size-2.5 bg-blanco"
              style={{ left: 0, transform: "translate(-50%, -50%)" }}
            />
          </div>

          <div className="mt-8 grid items-center gap-5 md:mt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            {/* Los cuatro textos, apilados en la misma celda; se ve el de la etapa activa. */}
            <div className="grid">
              {ETAPAS.map((etapa, i) => {
                const visible = i === activa;
                return (
                  <div
                    key={etapa.id}
                    aria-hidden={!visible}
                    className={`col-start-1 row-start-1 transition-[opacity,transform] duration-700 ease-out ${
                      visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3"
                    }`}
                    style={{ "--acento": colorDe(etapa.id) } as CSSProperties}
                  >
                    <p className="font-michroma text-xs uppercase tracking-etiqueta text-[var(--acento)]">
                      0{i + 1} · {etapa.nombre}
                    </p>
                    <h3 className="mt-3 font-plex text-xl font-bold leading-tight text-blanco md:text-3xl">
                      {etapa.titular}
                    </h3>
                    <p className="mt-3 max-w-xl font-lectura text-[15px] leading-relaxed text-acero md:text-base">
                      {etapa.texto}
                    </p>
                    <p className="mt-4 flex items-center gap-3 font-plex text-sm font-bold text-blanco">
                      <span aria-hidden className="size-1.5 shrink-0 bg-[var(--acento)]" />
                      {etapa.marca}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* La foto de la etapa, teñida con su color. */}
            <div className="relative order-first aspect-[21/9] overflow-hidden rounded-[8px] border border-profundo bg-negro lg:order-none lg:aspect-[16/10]">
              {ETAPAS.map((etapa, i) => {
                const visual = OBJETIVO_VISUAL[etapa.id];
                return (
                  <Image
                    key={etapa.id}
                    src={visual.foto.src}
                    alt={visual.foto.alt}
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className={`object-cover transition-[opacity,transform] duration-1000 ease-out ${
                      i === activa ? "scale-100 opacity-100" : "scale-105 opacity-0"
                    }`}
                  />
                );
              })}
              <div
                aria-hidden
                className="absolute inset-0 mix-blend-color transition-[background] duration-1000"
                style={{ background: color, opacity: 0.42 }}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,13,15,0.05)_50%,rgba(13,13,15,0.7))]"
              />
              <p className="absolute bottom-4 left-4 flex items-center gap-2 font-plex text-[11px] uppercase tracking-etiqueta text-blanco">
                <span aria-hidden className="size-1.5" style={{ background: color }} />
                {OBJETIVO.ayuda}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cabecera() {
  return (
    <>
      <p className="flex items-center gap-3 font-michroma text-xs uppercase tracking-etiqueta text-acero">
        <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
        {OBJETIVO.etiqueta}
      </p>
      <h2 className="mt-3 max-w-3xl font-plex text-xl font-bold leading-tight text-blanco md:mt-4 md:text-3xl lg:text-4xl">
        {OBJETIVO.titulo}
      </h2>
      <p className="mt-2 hidden max-w-2xl font-lectura text-sm leading-relaxed text-acero sm:block md:mt-3 md:text-base">
        {OBJETIVO.bajada}
      </p>
    </>
  );
}
