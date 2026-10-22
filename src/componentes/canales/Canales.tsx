"use client";

import Link from "next/link";
import { ViewTransition, useEffect, useRef, useState, type CSSProperties } from "react";
import { ACENTO_CANAL, type IdCanal } from "@/datos/colores";
import { CANALES, INICIO } from "@/datos/textos";
import { useVista } from "@/estado/vista";
import { IconoCanal } from "./IconoCanal";
import { tipoTransicion } from "./navegacion";
import { VistaPreviaCanal } from "./VistaPreviaCanal";

const TEXTOS = INICIO.canales;
const SEGUNDOS_POR_CANAL = 4.8;

/**
 * Los canales de la portada: por dónde seguir mirando.
 *
 * Computadora: la lista de canales a la izquierda y un monitor a la
 * derecha, sin líneas ni cables entre los dos (decisión de fabrizio): el
 * canal al frente se pone en blanco y el monitor muestra una vista en vivo
 * de lo que hay adentro. Se recorren solos, uno por uno; al pasar el mouse
 * por uno, se queda en ese. Hay un botón para pausar el recorrido.
 *
 * Celular: las tarjetas de cada canal, una debajo de la otra. Sin mouse,
 * lo que en la computadora pasa al pasar por encima pasa con el scroll: la
 * tarjeta que queda en el medio de la pantalla mueve su vista.
 *
 * Cada nombre de canal comparte transición con el encabezado de su
 * página: al tocarlo, la palabra viaja hasta allá.
 */
export function Canales() {
  const vista = useVista();
  const [activo, setActivo] = useState(0);
  const [encima, setEncima] = useState(false);
  const [enPausa, setEnPausa] = useState(false);
  const [aLaVista, setALaVista] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const tarjetas = useRef<Array<HTMLLIElement | null>>([]);
  const [alCentro, setAlCentro] = useState(-1);

  const canal = CANALES[activo];
  const recorriendo = vista === "3d" && aLaVista && !encima && !enPausa;

  useEffect(() => {
    const raiz = caja.current;
    if (!raiz) return;
    const observador = new IntersectionObserver(([entrada]) => setALaVista(entrada.isIntersecting), {
      threshold: 0.3,
    });
    observador.observe(raiz);
    return () => observador.disconnect();
  }, []);

  // Celular: cuál tarjeta está en el medio de la pantalla.
  useEffect(() => {
    if (vista !== "3d" || window.matchMedia("(min-width: 1024px)").matches) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          const indice = tarjetas.current.indexOf(entrada.target as HTMLLIElement);
          if (entrada.isIntersecting) setAlCentro(indice);
          else setAlCentro((actual) => (actual === indice ? -1 : actual));
        }
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    for (const tarjeta of tarjetas.current) if (tarjeta) observador.observe(tarjeta);
    return () => observador.disconnect();
  }, [vista]);

  useEffect(() => {
    if (!recorriendo) return;
    const temporizador = setTimeout(
      () => setActivo((i) => (i + 1) % CANALES.length),
      SEGUNDOS_POR_CANAL * 1000,
    );
    return () => clearTimeout(temporizador);
  }, [recorriendo, activo]);

  return (
    <section aria-labelledby="canales-titulo" className="relative border-t border-profundo">
      <div className="contenedor py-20 md:py-28">
        <h2 id="canales-titulo" data-revelar className="titulo text-3xl leading-tight text-blanco md:text-5xl">
          {TEXTOS.titulo}
        </h2>

        {/* Computadora: la lista y el monitor. */}
        <div
          ref={caja}
          onPointerEnter={() => setEncima(true)}
          onPointerLeave={() => setEncima(false)}
          className="relative mt-14 hidden grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-center gap-16 lg:grid xl:gap-24"
        >
          <ol className="relative">
            {CANALES.map((c, i) => {
              const encendido = i === activo;
              const id = c.id as IdCanal;
              return (
                <li key={c.id} style={{ "--acento": ACENTO_CANAL[id] } as CSSProperties}>
                  <Link
                    href={c.ruta}
                    transitionTypes={[tipoTransicion("/", c.ruta)]}
                    onPointerEnter={() => setActivo(i)}
                    onFocus={() => setActivo(i)}
                    data-cursor-texto={TEXTOS.entrar}
                    className="group relative flex items-center gap-5 py-5"
                  >
                    <span className="min-w-0 flex-1">
                      <ViewTransition name={`canal-${id}`} share="morph-web" default="none">
                        <span
                          className={`block font-michroma text-xl uppercase leading-none tracking-marca transition-colors duration-(--duracion-rapida) xl:text-2xl ${
                            encendido ? "text-blanco" : "text-acero"
                          }`}
                        >
                          {c.nombre}
                        </span>
                      </ViewTransition>
                      <span
                        className={`block overflow-hidden font-lectura text-sm leading-snug text-acero transition-[max-height,opacity,margin] duration-(--duracion-media) ${
                          encendido ? "mt-2.5 max-h-12 opacity-100" : "mt-0 max-h-0 opacity-0"
                        }`}
                      >
                        {c.frase}
                      </span>
                    </span>
                    <IconoCanal
                      id={id}
                      className={`size-5 shrink-0 transition-colors duration-(--duracion-rapida) ${encendido ? "text-[var(--acento)]" : "text-profundo"}`}
                    />
                  </Link>
                </li>
              );
            })}
          </ol>

          {/* El monitor: lo que hay dentro del canal al frente. */}
          <div
            style={{ "--acento": ACENTO_CANAL[canal.id as IdCanal] } as CSSProperties}
            className="relative overflow-hidden rounded-2xl border border-profundo bg-negro transition-colors duration-(--duracion-media)"
          >
            <div className="flex items-center gap-3 border-b border-profundo px-4 py-2.5">
              <span aria-hidden className="flex gap-1.5">
                <span className="size-1.5 bg-[var(--acento)]" />
                <span className="size-1.5 bg-profundo" />
                <span className="size-1.5 bg-profundo" />
              </span>
              <span className="min-w-0 flex-1 truncate font-lectura text-sm font-medium text-acero">
                {canal.nombre}
              </span>
              {/* "En vivo" es también el control del recorrido: pausa y sigue. */}
              {vista === "3d" ? (
                <button
                  type="button"
                  onClick={() => setEnPausa((pausa) => !pausa)}
                  aria-pressed={enPausa}
                  aria-label={enPausa ? TEXTOS.seguir : TEXTOS.pausar}
                  className="flex items-center gap-2 font-lectura text-sm text-acero transition-colors hover:text-blanco"
                >
                  <span
                    aria-hidden
                    className={`size-1.5 ${recorriendo ? "bg-[var(--acento)] motion-safe:animate-[parpadeo_2.2s_ease-in-out_infinite]" : "bg-profundo"}`}
                  />
                  {TEXTOS.enVivo}
                  <svg aria-hidden viewBox="0 0 12 12" className="ml-1 size-2.5 fill-current">
                    {enPausa ? (
                      <path d="M3 1.5 10.5 6 3 10.5Z" />
                    ) : (
                      <>
                        <rect x="2" y="1.5" width="3" height="9" />
                        <rect x="7" y="1.5" width="3" height="9" />
                      </>
                    )}
                  </svg>
                </button>
              ) : null}
            </div>
            <Link
              href={canal.ruta}
              transitionTypes={[tipoTransicion("/", canal.ruta)]}
              tabIndex={-1}
              aria-hidden
              data-cursor-texto={TEXTOS.entrar}
              className="relative block aspect-[16/10] overflow-hidden bg-negro"
            >
              {CANALES.map((c, i) => (
                <span
                  key={c.id}
                  className={`absolute inset-0 transition-opacity duration-(--duracion-media) ${i === activo ? "opacity-100" : "opacity-0"}`}
                >
                  <VistaPreviaCanal id={c.id as IdCanal} vivo={i === activo && aLaVista && vista === "3d"} />
                </span>
              ))}
            </Link>
            {/* Abajo: en qué canal va el recorrido (sin repetir la frase de la lista). */}
            <div className="flex items-center justify-between gap-4 border-t border-profundo px-4 py-3">
              <span aria-hidden className="flex items-center gap-1.5">
                {CANALES.map((c, i) => (
                  <span
                    key={c.id}
                    className={`block h-1.5 transition-[width,background-color] duration-(--duracion-media) ${i === activo ? "w-5" : "w-1.5 bg-profundo"}`}
                    style={i === activo ? { background: ACENTO_CANAL[c.id as IdCanal] } : undefined}
                  />
                ))}
              </span>
              <span aria-hidden className="shrink-0 font-lectura text-sm font-medium text-blanco">
                {TEXTOS.entrar} →
              </span>
            </div>
          </div>
        </div>

        {/* Celular y pantallas medianas: las tarjetas de los canales. */}
        <ol className="relative mt-10 lg:hidden">
          {CANALES.map((c, i) => {
            const id = c.id as IdCanal;
            return (
              <li
                key={c.id}
                ref={(elemento) => {
                  tarjetas.current[i] = elemento;
                }}
                className="relative pb-6 last:pb-0"
              >
                <Link
                  href={c.ruta}
                  transitionTypes={[tipoTransicion("/", c.ruta)]}
                  className="group block overflow-hidden rounded-2xl border border-profundo bg-negro"
                >
                  <span className="relative block aspect-[16/9] overflow-hidden">
                    <VistaPreviaCanal id={id} vivo={i === alCentro} />
                  </span>
                  <span className="flex items-end justify-between gap-4 p-4">
                    <span className="min-w-0">
                      <span className="block font-michroma text-lg uppercase leading-none tracking-marca text-blanco">
                        {c.nombre}
                      </span>
                      <span className="mt-2 block font-lectura text-sm leading-snug text-acero">{c.frase}</span>
                    </span>
                    <span
                      aria-hidden
                      className="flex size-10 shrink-0 items-center justify-center border border-profundo font-plex text-blanco"
                    >
                      →
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
