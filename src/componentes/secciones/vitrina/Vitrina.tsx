"use client";

import { ViewTransition, addTransitionType, startTransition, useEffect, useRef, useState } from "react";
import { PROYECTOS, TIPOS, type Proyecto, type TipoProyecto } from "@/datos/portfolio";
import { WEBS } from "@/datos/textos";
import { useVista } from "@/estado/vista";
import { CONSULTA_ANGOSTA, dosDigitos, useConsulta } from "./comun";
import { TarjetaProyecto } from "./TarjetaProyecto";
import { VisorProyecto } from "./VisorProyecto";

type Filtro = TipoProyecto | "todo";

const TEXTOS = WEBS.vitrina;
/** Las tarjetas solo se animan al filtrar; al abrir el visor se quedan quietas. */
const FICHA_ENTRA = { filtro: "ficha-entra", default: "none" };
const FICHA_SALE = { filtro: "ficha-sale", default: "none" };
const FICHA_MUEVE = { filtro: "ficha-mueve", default: "none" };

/**
 * En la grilla de escritorio (6 columnas) las primeras van grandes, para
 * que las filas siempre cierren: 8 → 2 grandes + 3 + 3; 7 → 2 + 2 + 3;
 * 6 → 3 + 3.
 */
function claseColumna(indice: number, cantidad: number) {
  const grandes = cantidad % 3 === 2 ? 2 : cantidad % 3 === 1 ? 4 : 0;
  return indice < grandes ? "lg:col-span-3" : "lg:col-span-2";
}

/**
 * La vitrina del portfolio.
 *
 * Computadora: filtros con contadores y una grilla en mosaico; al pasar el
 * mouse cada web se mueve sola y el cursor dice "Entrar".
 * Celular: un carrusel que se desliza con el dedo, con la tarjeta del
 * centro recorriéndose sola y un indicador de posición abajo.
 *
 * Filtrar, abrir el visor y pasar de un proyecto a otro usan transiciones
 * de vista (React <ViewTransition>): solo en vista 3D; en vista texto los
 * cambios son directos.
 *
 * En la portada va una selección (`proyectos`) sin filtros.
 */
export function Vitrina({
  proyectos = PROYECTOS,
  conFiltros = true,
}: {
  proyectos?: readonly Proyecto[];
  conFiltros?: boolean;
}) {
  const vista = useVista();
  const angosta = useConsulta(CONSULTA_ANGOSTA);
  const tactil = useConsulta("(hover: none)");
  const [filtro, setFiltro] = useState<Filtro>("todo");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [alFrente, setAlFrente] = useState(0);
  const [enPantalla, setEnPantalla] = useState(false);
  const lista = useRef<HTMLUListElement>(null);
  const botones = useRef(new Map<string, HTMLButtonElement>());
  const ultimoAbierto = useRef<string | null>(null);

  const visibles = filtro === "todo" ? proyectos : proyectos.filter((p) => p.tipo === filtro);
  const indiceAbierto = abierto ? visibles.findIndex((p) => p.id === abierto) : -1;
  const enVivo = PROYECTOS.filter((p) => p.embebible).length;

  type Opcion = { valor: Filtro; texto: string; cantidad: number };
  const opciones: Opcion[] = [
    { valor: "todo", texto: TEXTOS.todo, cantidad: PROYECTOS.length } satisfies Opcion,
    ...(Object.keys(TIPOS) as TipoProyecto[]).map((tipo): Opcion => ({
      valor: tipo,
      texto: TIPOS[tipo].plural,
      cantidad: PROYECTOS.filter((p) => p.tipo === tipo).length,
    })),
  ].filter((opcion) => opcion.cantidad > 0);

  const conTransicion = (tipo: string, cambio: () => void) => {
    if (vista !== "3d") {
      cambio();
      return;
    }
    startTransition(() => {
      addTransitionType(tipo);
      cambio();
    });
  };

  const filtrar = (nuevo: Filtro) => {
    if (nuevo === filtro) return;
    lista.current?.scrollTo({ left: 0 });
    conTransicion("filtro", () => {
      setFiltro(nuevo);
      setAlFrente(0);
    });
  };

  const abrir = (id: string) => {
    ultimoAbierto.current = id;
    conTransicion("visor", () => setAbierto(id));
  };

  const cerrar = () => {
    // Si desde el visor se pasó a otro proyecto, su tarjeta tiene que estar
    // a la vista para que el visor vuelva a ella.
    const boton = abierto ? botones.current.get(abierto) : null;
    if (boton) {
      const caja = boton.getBoundingClientRect();
      const fuera = caja.top < 0 || caja.bottom > window.innerHeight || caja.left < 0 || caja.right > window.innerWidth;
      if (fuera) boton.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
    }
    conTransicion("visor", () => setAbierto(null));
  };

  const mover = (paso: 1 | -1) => {
    if (indiceAbierto < 0) return;
    const destino = visibles[(indiceAbierto + paso + visibles.length) % visibles.length];
    ultimoAbierto.current = destino.id;
    conTransicion(paso > 0 ? "paso-adelante" : "paso-atras", () => setAbierto(destino.id));
  };

  // Al cerrar, el foco vuelve a la tarjeta del último proyecto visto.
  useEffect(() => {
    if (abierto !== null || !ultimoAbierto.current) return;
    botones.current.get(ultimoAbierto.current)?.focus({ preventScroll: true });
    ultimoAbierto.current = null;
  }, [abierto]);

  // La vitrina a la vista: recién ahí se mueve algo (y se piden las capturas largas).
  useEffect(() => {
    const elemento = lista.current;
    if (!elemento) return;
    const observador = new IntersectionObserver(([entrada]) => setEnPantalla(entrada.isIntersecting), {
      rootMargin: "0px 0px -15% 0px",
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  // Carrusel del celular: cuál quedó al centro.
  useEffect(() => {
    const raiz = lista.current;
    if (!raiz || !angosta) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) setAlFrente(Number((entrada.target as HTMLElement).dataset.indice));
        }
      },
      { root: raiz, threshold: 0.6 },
    );
    for (const item of Array.from(raiz.children)) observador.observe(item);
    return () => observador.disconnect();
  }, [angosta, filtro]);

  const irA = (indice: number) => {
    const raiz = lista.current;
    const item = raiz?.children[indice] as HTMLElement | undefined;
    if (!raiz || !item) return;
    raiz.scrollTo({
      left: item.offsetLeft - (raiz.clientWidth - item.clientWidth) / 2,
      behavior: vista === "3d" ? "smooth" : "auto",
    });
  };

  const frente = visibles[Math.min(alFrente, visibles.length - 1)];

  return (
    <div>
      {/* Filtros con contadores y el resumen. */}
      <div className={conFiltros ? "flex flex-wrap items-end justify-between gap-x-8 gap-y-4" : "hidden"}>
        <div role="group" aria-label={TEXTOS.filtros} className="flex flex-wrap gap-2">
          {opciones.map((opcion) => {
            const activa = opcion.valor === filtro;
            return (
              <button
                key={opcion.valor}
                type="button"
                aria-pressed={activa}
                onClick={() => filtrar(opcion.valor)}
                className={`flex items-center gap-2.5 border px-3.5 py-2 font-plex text-xs font-medium uppercase tracking-etiqueta transition-colors ${
                  activa
                    ? "border-blanco bg-blanco text-negro"
                    : "border-profundo text-acero hover:border-acero hover:text-blanco"
                }`}
              >
                {opcion.texto}
                <span className={activa ? "text-negro/60" : "text-acero/70"}>{opcion.cantidad}</span>
              </button>
            );
          })}
        </div>
        <p className="font-plex text-xs text-acero">
          {PROYECTOS.length} {TEXTOS.proyectos} · {enVivo} {TEXTOS.enVivo}
        </p>
      </div>
      {tactil ? (
        <p className={`font-plex text-xs text-acero ${conFiltros ? "mt-4" : ""}`}>{TEXTOS.ayudaTactil}</p>
      ) : null}

      <ul
        ref={lista}
        className="carrusel-web -mx-[clamp(1.25rem,4vw,2rem)] mt-8 flex snap-x snap-mandatory scroll-px-[clamp(1.25rem,4vw,2rem)] gap-4 overflow-x-auto px-[clamp(1.25rem,4vw,2rem)] pb-3 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-6"
      >
        {visibles.map((proyecto, indice) => (
          <ViewTransition key={proyecto.id} enter={FICHA_ENTRA} exit={FICHA_SALE} update={FICHA_MUEVE} default="none">
            <li
              data-indice={indice}
              className={`w-[84%] shrink-0 snap-center md:w-auto ${claseColumna(indice, visibles.length)}`}
            >
              <TarjetaProyecto
                proyecto={proyecto}
                numero={PROYECTOS.indexOf(proyecto) + 1}
                alFrente={angosta && enPantalla && indice === alFrente && abierto === null}
                visorAbierto={abierto !== null}
                botonRef={(elemento) => {
                  if (elemento) botones.current.set(proyecto.id, elemento);
                  else botones.current.delete(proyecto.id);
                }}
                onAbrir={() => abrir(proyecto.id)}
              />
            </li>
          </ViewTransition>
        ))}
      </ul>

      {/* Celular: dónde estás en el carrusel. */}
      {frente ? (
        <div className="mt-4 flex items-center justify-between md:hidden">
          <p className="font-plex text-xs text-acero">
            <span className="text-blanco">{dosDigitos(alFrente + 1)}</span> / {dosDigitos(visibles.length)} ·{" "}
            {frente.nombre}
          </p>
          <div className="flex items-center gap-1.5">
            {visibles.map((proyecto, indice) => (
              <button
                key={proyecto.id}
                type="button"
                onClick={() => irA(indice)}
                aria-label={`${TEXTOS.posicion} ${indice + 1} ${TEXTOS.de} ${visibles.length}: ${proyecto.nombre}`}
                aria-current={indice === alFrente ? "true" : undefined}
                className="flex h-6 items-center"
              >
                <span
                  className={`block h-1.5 transition-[width,background-color] duration-(--duracion-rapida) ${
                    indice === alFrente ? "w-5" : "w-1.5 bg-profundo"
                  }`}
                  style={indice === alFrente ? { background: "var(--acento)" } : undefined}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {indiceAbierto >= 0 ? (
        <VisorProyecto
          proyecto={visibles[indiceAbierto]}
          numero={indiceAbierto + 1}
          total={visibles.length}
          onCerrar={cerrar}
          onMover={mover}
        />
      ) : null}
    </div>
  );
}
