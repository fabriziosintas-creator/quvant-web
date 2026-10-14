"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { NICHOS } from "@/datos/nucleo";
import { CAPTURAS } from "@/datos/sistema";
import { PLATAFORMAS } from "@/datos/textos";
import { useVista } from "@/estado/vista";

const Nucleo = dynamic(() => import("@/componentes/3d/Nucleo"), { ssr: false });

/**
 * El núcleo y sus plantillas: la escena 3D (en vista 3D, y solo cuando
 * está a la vista) y, al lado, la lista accesible con el detalle. Todo el
 * contenido está en la lista, en el HTML del servidor: la escena ilustra.
 *
 * Se recorre solo (núcleo y después cada nicho) cada pocos segundos, y se
 * frena con el puntero o el foco encima.
 */

const SEGUNDOS = 3.4;
const ORDEN = ["nucleo", ...NICHOS.map((n) => n.id)] as const;

export function NucleoInteractivo() {
  const { nucleo } = PLATAFORMAS;
  const vista = useVista();
  const [activo, setActivo] = useState<string>("nucleo");
  const [enPausa, setEnPausa] = useState(false);
  const [aLaVista, setALaVista] = useState(false);
  const ventana = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = ventana.current;
    if (!elemento) return;
    const observador = new IntersectionObserver(
      ([entrada]) => setALaVista(entrada.isIntersecting),
      { threshold: 0.2 },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const recorriendo = vista === "3d" && aLaVista && !enPausa;

  useEffect(() => {
    if (!recorriendo) return;
    const temporizador = setTimeout(() => {
      const i = ORDEN.indexOf(activo as (typeof ORDEN)[number]);
      setActivo(ORDEN[(i + 1) % ORDEN.length]);
    }, SEGUNDOS * 1000);
    return () => clearTimeout(temporizador);
  }, [recorriendo, activo]);

  const nicho = NICHOS.find((n) => n.id === activo) ?? null;
  // El núcleo no tiene color propio: es neutro, el color lo ponen los nichos.
  const acento = nicho ? nicho.color : "#ececee";
  const foto = nicho ? nicho.foto : { src: CAPTURAS.tablero.src, alt: CAPTURAS.tablero.alt };

  return (
    <div
      className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.9fr] lg:gap-10"
      onPointerEnter={() => setEnPausa(true)}
      onPointerLeave={() => setEnPausa(false)}
      onFocus={() => setEnPausa(true)}
      onBlur={() => setEnPausa(false)}
    >
      {/* La escena. */}
      <figure className="min-w-0">
        <div className="overflow-hidden rounded-[8px] border border-profundo">
          <figcaption className="flex items-center gap-3 border-b border-profundo px-4 py-2.5">
            <span aria-hidden className="size-1.5 bg-acero" />
            <span className="min-w-0 truncate font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
              {nucleo.ventana}
            </span>
          </figcaption>
          <div
            ref={ventana}
            className="relative aspect-[4/3] bg-negro sm:aspect-[16/10]"
            aria-hidden
          >
            {vista === "3d" && aLaVista ? <Nucleo activo={activo} onElegir={setActivo} /> : null}
            {/* El nombre del núcleo, sobre la esfera: la escena siempre la deja en este punto. */}
            {vista === "3d" ? (
              <p
                className={`pointer-events-none absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-negro/80 px-2.5 py-1 font-michroma text-[10px] uppercase tracking-marca transition-colors md:text-[11px] ${
                  activo === "nucleo" ? "text-blanco" : "text-acero"
                }`}
              >
                Quvant · {nucleo.etiquetaNucleo}
              </p>
            ) : null}
            {vista === "texto" ? (
              <p className="absolute inset-0 flex items-center justify-center px-6 text-center font-plex text-xs text-acero">
                {PLATAFORMAS.nucleo.apagado}
              </p>
            ) : null}
            <p className="pointer-events-none absolute bottom-3 right-4 font-plex text-[10px] uppercase tracking-etiqueta text-acero">
              {PLATAFORMAS.ilustracionEjemplo}
            </p>
          </div>
        </div>
        <p className="mt-3 font-plex text-[11px] text-acero">{nucleo.nota}</p>
      </figure>

      {/* La lista: el núcleo y cada nicho, con su detalle. */}
      <div className="min-w-0">
        <p className="font-plex text-xs text-acero">{nucleo.ayuda}</p>
        <div role="tablist" aria-label={nucleo.etiqueta} className="mt-4 flex flex-wrap gap-2">
          {ORDEN.map((id) => {
            const seleccionado = id === activo;
            const dato = NICHOS.find((n) => n.id === id);
            const nombre = id === "nucleo" ? nucleo.etiquetaNucleo : dato?.nombre;
            const colorFicha = dato ? dato.color : "#ececee";
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`nicho-${id}`}
                aria-selected={seleccionado}
                aria-controls="panel-nicho"
                onClick={() => setActivo(id)}
                style={{ "--acento": colorFicha } as CSSProperties}
                className={`flex items-center gap-2 border px-3 py-1.5 font-plex text-[11px] font-medium uppercase tracking-etiqueta transition-colors ${
                  seleccionado
                    ? "border-[var(--acento)] bg-[var(--acento)] text-negro"
                    : "border-profundo text-acero hover:border-[var(--acento)] hover:text-blanco"
                }`}
              >
                <span
                  aria-hidden
                  className={`size-1.5 ${seleccionado ? "bg-negro" : "bg-[var(--acento)]"}`}
                />
                {nombre}
              </button>
            );
          })}
        </div>

        <div
          id="panel-nicho"
          role="tabpanel"
          aria-labelledby={`nicho-${activo}`}
          style={{ "--acento": acento } as CSSProperties}
          className="mt-6 overflow-hidden rounded-[8px] border border-profundo"
        >
          {/* La foto de ambiente, teñida con el acento: las nueve se ven como una sola serie. */}
          <div className="relative aspect-[21/9] bg-negro">
            <Image
              key={foto.src}
              src={foto.src}
              alt={foto.alt}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 mix-blend-color"
              style={{ background: acento, opacity: 0.45 }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,13,15,0.05),rgba(13,13,15,0.82))]"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5">
              <p className="font-michroma text-base uppercase tracking-marca text-blanco md:text-lg">
                {nicho ? nicho.nombre : `Quvant · ${nucleo.etiquetaNucleo}`}
              </p>
              <span
                className={`border px-2 py-1 font-plex text-[10px] font-medium uppercase tracking-etiqueta ${
                  !nicho || nicho.estado === "disponible"
                    ? "border-[var(--acento)] bg-negro/60 text-blanco"
                    : "border-acero/60 bg-negro/60 text-acero"
                }`}
              >
                {nicho ? PLATAFORMAS.estados[nicho.estado] : nucleo.estadoNucleo}
              </span>
            </div>
          </div>
          <div className="p-6 md:p-7">
            <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
              {nicho ? nucleo.etiquetaWidgets : nucleo.etiquetaModulos}
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {(nicho ? nicho.widgets : nucleo.modulos).map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 border border-profundo px-3 py-2 font-plex text-xs text-blanco"
                >
                  <span aria-hidden className="size-1 shrink-0 bg-[var(--acento)]" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 font-plex text-sm leading-relaxed text-acero">
              {nicho ? nucleo.personalizable : nucleo.texto}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
