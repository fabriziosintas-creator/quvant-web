import Link from "next/link";
import { Suspense, ViewTransition, type CSSProperties } from "react";
import { Canales } from "@/componentes/canales/Canales";
import { DESLIZ_PAGINA } from "@/componentes/canales/navegacion";
import { AuroraFondo } from "@/componentes/estructura/AuroraFondo";
import { CintaRubros } from "@/componentes/estructura/CintaRubros";
import { IntroTV } from "@/componentes/estructura/IntroTV";
import { TextoTipeado } from "@/componentes/estructura/TextoTipeado";
import { VideoPortada } from "@/componentes/estructura/VideoPortada";
import { Vitrina } from "@/componentes/secciones/vitrina/Vitrina";
import { DatosEstructurados } from "@/componentes/seo/DatosEstructurados";
import { ACENTO_CANAL } from "@/datos/colores";
import { PROYECTOS } from "@/datos/portfolio";
import { HERO, INICIO } from "@/datos/textos";

/** Los destacados de la portada: un sitio de cliente, un sistema y una app. */
const DESTACADOS = ["grimm", "yunque", "hackfit"]
  .map((id) => PROYECTOS.find((proyecto) => proyecto.id === id))
  .filter((proyecto) => proyecto !== undefined);

/**
 * La portada: qué hacemos y para quién (con el video de la Q), los canales
 * para seguir mirando, tres trabajos para probar ahí mismo y el cierre.
 * Todo lo demás vive en la página de cada canal.
 *
 * Los canales y la vitrina van en su propio <Suspense>: el HTML llega
 * igual de completo, pero React los hidrata por separado, en tandas
 * cortas, y el celular no se queda trabado al cargar.
 */
export default function Inicio() {
  return (
    <ViewTransition enter={DESLIZ_PAGINA} exit={DESLIZ_PAGINA} default="none">
      <div>
        <DatosEstructurados />
        <IntroTV />
        <section
          id="inicio"
          className="relative flex min-h-svh flex-col justify-end overflow-hidden pb-16 pt-16 lg:justify-center lg:pb-0"
        >
          <VideoPortada />
          <AuroraFondo />
          <div className="contenedor relative z-10">
            <h1>
              <span
                data-titulo-portada
                className="block cursor-pointer select-none font-michroma text-[clamp(2.5rem,13vw,4.75rem)] leading-none tracking-marca text-blanco md:text-[clamp(4.75rem,8vw,8.5rem)]"
              >
                {HERO.titulo}
              </span>
              <span className="sr-only"> · </span>
              <span className="mt-7 block max-w-xl titulo text-lg leading-snug text-blanco md:text-2xl">
                <TextoTipeado texto={HERO.propuesta} velocidadMs={24} />
              </span>
            </h1>
            <div className="mt-10 flex flex-wrap gap-3 md:gap-4">
              <Link
                href={HERO.botonPrimario.destino}
                transitionTypes={["canal-adelante"]}
                className="rounded-full inline-flex h-12 items-center justify-center gap-3 bg-blanco px-7 font-lectura text-sm font-medium text-negro transition-colors hover:bg-acero"
              >
                {HERO.botonPrimario.texto}
                <span className="font-plex text-xs text-negro/50">{PROYECTOS.length}</span>
              </Link>
              <Link
                href={HERO.botonSecundario.destino}
                transitionTypes={["canal-adelante"]}
                className="rounded-full inline-flex h-12 items-center justify-center border border-profundo px-7 font-lectura text-sm font-medium text-blanco transition-colors hover:border-acero"
              >
                {HERO.botonSecundario.texto}
              </Link>
            </div>
            <CintaRubros />
          </div>

          {/* Pista de scroll: el punto cuadrado bajando por un riel fino. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-9 z-10 hidden md:block">
            <div className="contenedor flex justify-end">
              <div className="relative h-9 w-px bg-profundo">
                <span className="absolute -left-[2.5px] top-0 size-1.5 bg-blanco motion-safe:animate-[desliz_2.2s_var(--ease-vaiven)_infinite]" />
              </div>
            </div>
          </div>
        </section>

        <Suspense>
          <Canales />
        </Suspense>

        {/* Tres trabajos para entrar ahí mismo. */}
        <section
          aria-labelledby="destacados-titulo"
          className="border-t border-profundo"
          style={{ "--acento": ACENTO_CANAL.trabajos } as CSSProperties}
        >
          <div className="contenedor py-20 md:py-28">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 id="destacados-titulo" data-revelar className="titulo text-3xl leading-tight text-blanco md:text-5xl">
                {INICIO.destacados.titulo}
              </h2>
              <Link
                href="/trabajos"
                transitionTypes={["canal-adelante"]}
                className="group inline-flex items-center gap-3 rounded-2xl bg-profundo/35 px-5 py-3 font-lectura text-sm font-medium text-blanco transition-colors hover:border-[var(--acento)]"
              >
                {INICIO.destacados.verTodos}
                <span className="text-acero">{PROYECTOS.length}</span>
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
            <div className="mt-10">
              <Suspense>
                <Vitrina proyectos={DESTACADOS} conFiltros={false} />
              </Suspense>
            </div>
          </div>
        </section>

        {/* El cierre: una sola pregunta, grande y a todo el ancho (sin caja), con
            el verde de Contacto subiendo desde abajo, y un botón. */}
        <section
          className="relative overflow-hidden border-t border-profundo"
          style={{ "--acento": ACENTO_CANAL.contacto } as CSSProperties}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 75% 85% at 50% 115%, color-mix(in srgb, var(--acento) 20%, transparent), transparent 70%)",
            }}
          />
          <div className="contenedor relative py-24 md:py-36">
            <h2 data-revelar className="max-w-5xl titulo text-[clamp(2.5rem,7.5vw,6.5rem)] leading-[1.02] text-blanco">
              {INICIO.cierre.titulo}
            </h2>
            <div className="mt-8 flex flex-col gap-8 md:mt-10 md:flex-row md:items-end md:justify-between">
              <p data-revelar className="max-w-xl font-lectura text-base leading-relaxed text-blanco md:text-xl">
                {INICIO.cierre.texto}
              </p>
              <Link
                href="/contacto"
                transitionTypes={["canal-adelante"]}
                className="inline-flex h-14 shrink-0 items-center justify-center gap-3 self-start bg-blanco px-9 font-lectura text-sm font-medium text-negro transition-colors hover:bg-acero md:self-auto"
              >
                <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
                {INICIO.cierre.boton}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </ViewTransition>
  );
}
