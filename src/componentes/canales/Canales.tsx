"use client";

import Link from "next/link";
import {
  ViewTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ACENTO_CANAL, type IdCanal } from "@/datos/colores";
import { CANALES, INICIO, NAVEGACION } from "@/datos/textos";
import { useVista } from "@/estado/vista";
import { IconoCanal } from "./IconoCanal";
import { numeroCanal, tipoTransicion } from "./navegacion";
import { VistaPreviaCanal } from "./VistaPreviaCanal";

const TEXTOS = INICIO.canales;
const SEGUNDOS_POR_CANAL = 4.8;

type Cable = { d: string; id: IdCanal };

/**
 * Los canales de la portada: por dónde seguir mirando.
 *
 * Computadora: la lista de canales a la izquierda y un monitor a la
 * derecha, unidos por cables (las líneas de conexión). El canal al frente
 * se enciende con su color, su cable lleva un pulso que corre hacia el
 * monitor y el monitor muestra una vista en vivo de lo que hay adentro.
 * Se recorren solos; al pasar el mouse por uno, se queda en ese. Hay un
 * botón para pausar el recorrido.
 *
 * Celular: una línea vertical que une las tarjetas de cada canal, como un
 * mapa de subte; se va llenando con el scroll.
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
  const [cables, setCables] = useState<Cable[]>([]);
  const caja = useRef<HTMLDivElement>(null);
  const monitor = useRef<HTMLDivElement>(null);
  const filas = useRef<Array<HTMLAnchorElement | null>>([]);

  const canal = CANALES[activo];
  const recorriendo = vista === "3d" && aLaVista && !encima && !enPausa;

  // Los cables: de la punta derecha de cada fila al puerto del monitor.
  const trazar = useCallback(() => {
    const raiz = caja.current?.getBoundingClientRect();
    const pantalla = monitor.current?.getBoundingClientRect();
    if (!raiz || !pantalla || pantalla.width === 0) return;
    const x1 = pantalla.left - raiz.left;
    const y1 = pantalla.top - raiz.top + pantalla.height / 2;
    setCables(
      CANALES.map((c, i) => {
        const fila = filas.current[i]?.getBoundingClientRect();
        if (!fila) return { d: "", id: c.id };
        const x0 = fila.right - raiz.left;
        const y0 = fila.top - raiz.top + fila.height / 2;
        const curva = (x1 - x0) * 0.55;
        return { d: `M ${x0} ${y0} C ${x0 + curva} ${y0}, ${x1 - curva} ${y1}, ${x1} ${y1}`, id: c.id };
      }),
    );
  }, []);

  useLayoutEffect(() => {
    const raiz = caja.current;
    if (!raiz) return;
    trazar();
    const observador = new ResizeObserver(trazar);
    observador.observe(raiz);
    document.fonts?.ready.then(trazar);
    return () => observador.disconnect();
  }, [trazar]);

  useEffect(() => {
    const raiz = caja.current;
    if (!raiz) return;
    const observador = new IntersectionObserver(([entrada]) => setALaVista(entrada.isIntersecting), {
      threshold: 0.3,
    });
    observador.observe(raiz);
    return () => observador.disconnect();
  }, []);

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
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p data-revelar className="flex items-center gap-3 font-michroma text-xs uppercase tracking-etiqueta text-acero">
              <span aria-hidden className="size-1.5 bg-blanco" />
              {TEXTOS.etiqueta}
            </p>
            <h2
              id="canales-titulo"
              data-revelar
              className="mt-5 titulo text-3xl leading-tight text-blanco md:text-5xl"
            >
              {TEXTOS.titulo}
            </h2>
          </div>
          {vista === "3d" ? (
            <button
              type="button"
              onClick={() => setEnPausa((pausa) => !pausa)}
              aria-pressed={enPausa}
              aria-label={enPausa ? TEXTOS.seguir : TEXTOS.pausar}
              className="hidden items-center gap-2 font-plex text-[11px] uppercase tracking-etiqueta text-acero transition-colors hover:text-blanco lg:flex"
            >
              <span
                aria-hidden
                className={`size-1.5 ${recorriendo ? "bg-blanco motion-safe:animate-[parpadeo_1.4s_steps(2,end)_infinite]" : "bg-profundo"}`}
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

        {/* Computadora: lista, cables y monitor. */}
        <div
          ref={caja}
          onPointerEnter={() => setEncima(true)}
          onPointerLeave={() => setEncima(false)}
          className="relative mt-14 hidden grid-cols-[minmax(0,0.9fr)_6rem_minmax(0,1.1fr)] items-center lg:grid xl:grid-cols-[minmax(0,0.9fr)_8rem_minmax(0,1.1fr)]"
        >
          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            {cables.map((cable, i) =>
              cable.d ? (
                <g key={cable.id}>
                  <path d={cable.d} fill="none" stroke="#26262B" strokeWidth="1" />
                  {i === activo ? (
                    <>
                      <path d={cable.d} fill="none" stroke={ACENTO_CANAL[cable.id]} strokeWidth="1" opacity="0.5" />
                      <path
                        d={cable.d}
                        fill="none"
                        stroke={ACENTO_CANAL[cable.id]}
                        strokeWidth="2"
                        strokeDasharray="4 14"
                        className="cable-flujo"
                      />
                    </>
                  ) : null}
                </g>
              ) : null,
            )}
          </svg>

          <ol className="relative">
            {CANALES.map((c, i) => {
              const encendido = i === activo;
              const id = c.id as IdCanal;
              return (
                <li key={c.id} style={{ "--acento": ACENTO_CANAL[id] } as CSSProperties}>
                  <Link
                    ref={(elemento) => {
                      filas.current[i] = elemento;
                    }}
                    href={c.ruta}
                    transitionTypes={[tipoTransicion("/", c.ruta)]}
                    onPointerEnter={() => setActivo(i)}
                    onFocus={() => setActivo(i)}
                    data-cursor-texto={TEXTOS.entrar}
                    className="group relative flex items-center gap-5 border-b border-profundo py-5 first:border-t"
                  >
                    <span className="w-6 font-plex text-[11px] text-acero">{numeroCanal(id)}</span>
                    <span className="min-w-0 flex-1">
                      <ViewTransition name={`canal-${id}`} share="morph-web" default="none">
                        <span
                          className={`block font-michroma text-xl uppercase leading-none tracking-marca transition-colors duration-300 xl:text-2xl ${
                            encendido ? "text-blanco" : "text-acero"
                          }`}
                        >
                          {c.nombre}
                        </span>
                      </ViewTransition>
                      <span
                        className={`block overflow-hidden font-lectura text-sm leading-snug text-acero transition-[max-height,opacity,margin] duration-500 ${
                          encendido ? "mt-2.5 max-h-12 opacity-100" : "mt-0 max-h-0 opacity-0"
                        }`}
                      >
                        {c.frase}
                      </span>
                    </span>
                    <IconoCanal
                      id={id}
                      className={`size-5 shrink-0 transition-colors duration-300 ${encendido ? "text-[var(--acento)]" : "text-profundo"}`}
                    />
                    {/* El tiempo que queda en este canal. */}
                    {encendido && recorriendo ? (
                      <span
                        key={activo}
                        aria-hidden
                        className="absolute -bottom-px left-0 h-px bg-[var(--acento)]"
                        style={{ animation: `avance ${SEGUNDOS_POR_CANAL}s linear forwards` }}
                      />
                    ) : encendido ? (
                      <span aria-hidden className="absolute -bottom-px left-0 h-px w-full bg-[var(--acento)]" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>

          <span aria-hidden />

          {/* El monitor: lo que hay dentro del canal al frente. */}
          <div
            ref={monitor}
            style={{ "--acento": ACENTO_CANAL[canal.id as IdCanal] } as CSSProperties}
            className="relative overflow-hidden rounded-[10px] border border-profundo bg-negro transition-colors duration-500"
          >
            {/* El puerto donde llegan los cables. */}
            <span aria-hidden className="absolute -left-px top-1/2 z-10 block h-6 w-[3px] -translate-y-1/2 bg-[var(--acento)]" />
            <div className="flex items-center gap-3 border-b border-profundo px-4 py-2.5">
              <span aria-hidden className="flex gap-1.5">
                <span className="size-1.5 bg-[var(--acento)]" />
                <span className="size-1.5 bg-profundo" />
                <span className="size-1.5 bg-profundo" />
              </span>
              <span className="min-w-0 flex-1 truncate font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
                {NAVEGACION.canal} {numeroCanal(canal.id)} · {canal.nombre}
              </span>
              <span className="flex items-center gap-2 font-plex text-[11px] uppercase tracking-etiqueta text-acero">
                <span aria-hidden className="size-1.5 bg-[var(--acento)] motion-safe:animate-[parpadeo_1.4s_steps(2,end)_infinite]" />
                {TEXTOS.enVivo}
              </span>
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
                  className={`absolute inset-0 transition-opacity duration-500 ${i === activo ? "opacity-100" : "opacity-0"}`}
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
                    className={`block h-1.5 transition-[width,background-color] duration-500 ${i === activo ? "w-5" : "w-1.5 bg-profundo"}`}
                    style={i === activo ? { background: ACENTO_CANAL[c.id as IdCanal] } : undefined}
                  />
                ))}
              </span>
              <span aria-hidden className="shrink-0 font-plex text-[11px] font-medium uppercase tracking-etiqueta text-blanco">
                {TEXTOS.entrar} →
              </span>
            </div>
          </div>
        </div>

        {/* Celular y pantallas medianas: la línea de canales. */}
        <ol className="relative mt-10 lg:hidden">
          <span aria-hidden className="absolute bottom-10 left-[5px] top-6 w-px bg-profundo" />
          <span
            aria-hidden
            className="linea-canales absolute bottom-10 left-[5px] top-6 w-px origin-top"
            style={{
              background: `linear-gradient(${CANALES.map((c) => ACENTO_CANAL[c.id as IdCanal]).join(", ")})`,
            }}
          />
          {CANALES.map((c) => {
            const id = c.id as IdCanal;
            return (
              <li key={c.id} className="relative pb-6 pl-8 last:pb-0" style={{ "--acento": ACENTO_CANAL[id] } as CSSProperties}>
                <span aria-hidden className="absolute left-0 top-5 block size-[11px] border border-[var(--acento)] bg-negro" />
                <Link
                  href={c.ruta}
                  transitionTypes={[tipoTransicion("/", c.ruta)]}
                  className="group block overflow-hidden rounded-[10px] border border-profundo bg-negro transition-colors active:border-[var(--acento)]"
                >
                  <span className="relative block aspect-[16/9] overflow-hidden">
                    <VistaPreviaCanal id={id} vivo={false} />
                  </span>
                  <span className="flex items-end justify-between gap-4 p-4">
                    <span className="min-w-0">
                      <span className="font-plex text-[11px] text-acero">
                        {NAVEGACION.canal} {numeroCanal(id)}
                      </span>
                      <span className="mt-1.5 block font-michroma text-lg uppercase leading-none tracking-marca text-blanco">
                        {c.nombre}
                      </span>
                      <span className="mt-2 block font-lectura text-sm leading-snug text-acero">{c.frase}</span>
                    </span>
                    <span
                      aria-hidden
                      className="flex size-10 shrink-0 items-center justify-center border border-profundo font-plex text-blanco transition-colors group-active:border-[var(--acento)]"
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
