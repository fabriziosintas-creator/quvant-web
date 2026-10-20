"use client";

import { useEffect, useRef, useState } from "react";
import { NAVEGACION } from "@/datos/textos";

type Capitulo = { readonly id: string; readonly nombre: string };

/**
 * Dónde estás dentro de una página de canal, de dos maneras:
 *
 * Pantallas anchas (desde 1360 px, donde sobra margen): un riel vertical a
 * la izquierda, con un nodo por capítulo unidos por la línea del canal,
 * que se llena a medida que bajás. Los nombres aparecen al pasar el mouse.
 *
 * Celular y pantallas medianas: una barra fija debajo del encabezado con
 * los capítulos como fichas que se deslizan de costado; la del capítulo
 * actual se enciende y se acomoda a la vista, y abajo corre el progreso.
 *
 * Los saltos son anclas comunes (el scroll suave los toma); el capítulo
 * actual sale de un IntersectionObserver sobre las secciones [data-capitulo].
 */
export function RielCapitulos({ capitulos }: { capitulos: readonly Capitulo[] }) {
  const [actual, setActual] = useState(capitulos[0]?.id ?? "");
  const progreso = useRef<HTMLSpanElement>(null);
  const progresoRiel = useRef<HTMLSpanElement>(null);
  const fichas = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const secciones = capitulos
      .map((capitulo) => document.getElementById(capitulo.id))
      .filter((seccion): seccion is HTMLElement => Boolean(seccion));
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) setActual((entrada.target as HTMLElement).id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const seccion of secciones) observador.observe(seccion);
    return () => observador.disconnect();
  }, [capitulos]);

  // El progreso de toda la página, en las dos versiones.
  useEffect(() => {
    let cuadro = 0;
    const medir = () => {
      cuadro = 0;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const valor = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      progreso.current?.style.setProperty("--progreso", String(valor));
      progresoRiel.current?.style.setProperty("--progreso", String(valor));
    };
    const alDesplazar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    window.addEventListener("resize", alDesplazar);
    return () => {
      window.removeEventListener("scroll", alDesplazar);
      window.removeEventListener("resize", alDesplazar);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  // En la barra del celular, la ficha actual siempre a la vista.
  useEffect(() => {
    const ficha = fichas.current[actual];
    const barra = ficha?.parentElement?.parentElement;
    if (!ficha || !barra) return;
    barra.scrollTo({ left: ficha.offsetLeft - 16, behavior: "smooth" });
  }, [actual]);

  return (
    <>
      {/* Celular y pantallas medianas: la barra de capítulos. */}
      <nav
        aria-label={NAVEGACION.capitulos}
        className="barra-capitulos sticky top-16 z-30 border-y border-profundo bg-negro/85 backdrop-blur-md md:top-20 min-[1360px]:hidden"
      >
        <ul className="carrusel-web contenedor flex gap-2 overflow-x-auto py-2.5">
          {capitulos.map((capitulo) => {
            const activo = capitulo.id === actual;
            return (
              <li key={capitulo.id} className="shrink-0">
                <a
                  ref={(elemento) => {
                    fichas.current[capitulo.id] = elemento;
                  }}
                  href={`#${capitulo.id}`}
                  aria-current={activo ? "location" : undefined}
                  className={`flex items-center gap-2 border px-3 py-1.5 font-lectura text-sm font-medium transition-colors ${
                    activo
                      ? "border-[var(--acento)] text-blanco"
                      : "border-profundo text-acero hover:text-blanco"
                  }`}
                >
                  <span aria-hidden className={`size-1.5 shrink-0 ${activo ? "bg-[var(--acento)]" : "bg-acero/60"}`} />
                  {capitulo.nombre}
                </a>
              </li>
            );
          })}
        </ul>
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px">
          <span ref={progreso} className="visor-progreso block h-full bg-[var(--acento)]" />
        </span>
      </nav>

      {/* Pantallas anchas: el riel vertical, en el margen izquierdo. */}
      <nav
        aria-label={NAVEGACION.capitulos}
        className="group/riel fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 min-[1360px]:block"
      >
        <div className="relative rounded-2xl border border-transparent py-3 pl-3 pr-3 transition-colors group-hover/riel:border-profundo group-hover/riel:bg-negro/90 group-hover/riel:backdrop-blur-md">
          {/* La línea del canal y su relleno. */}
          <span aria-hidden className="absolute bottom-6 left-[19px] top-6 w-px bg-profundo">
            <span
              ref={progresoRiel}
              className="block h-full w-full origin-top bg-[var(--acento)]"
              style={{ transform: "scaleY(var(--progreso, 0))" }}
            />
          </span>
          <ol className="relative flex flex-col gap-5">
            {capitulos.map((capitulo) => {
              const activo = capitulo.id === actual;
              return (
                <li key={capitulo.id}>
                  <a
                    href={`#${capitulo.id}`}
                    aria-current={activo ? "location" : undefined}
                    className="flex items-center gap-3"
                  >
                    <span
                      aria-hidden
                      className={`relative block size-[9px] shrink-0 border transition-colors ${
                        activo ? "border-[var(--acento)] bg-[var(--acento)]" : "border-acero/60 bg-negro"
                      }`}
                    />
                    <span
                      className={`font-lectura text-sm font-medium transition-colors ${
                        activo ? "text-blanco" : "text-acero"
                      }`}
                    >
                      <span className="hidden whitespace-nowrap group-hover/riel:inline group-focus-within/riel:inline">
                        {capitulo.nombre}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}
