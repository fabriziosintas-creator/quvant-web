import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";
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
                className="inline-flex h-12 items-center justify-center gap-3 bg-blanco px-7 font-plex text-[13px] font-medium uppercase tracking-[0.14em] text-negro transition-colors hover:bg-acero"
              >
                {HERO.botonPrimario.texto}
                <span className="font-plex text-[11px] text-negro/50">{PROYECTOS.length}</span>
              </Link>
              <Link
                href={HERO.botonSecundario.destino}
                transitionTypes={["canal-adelante"]}
                className="inline-flex h-12 items-center justify-center border border-profundo px-7 font-plex text-[13px] font-medium uppercase tracking-[0.14em] text-blanco transition-colors hover:border-acero"
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
                <span className="absolute -left-[2.5px] top-0 size-1.5 bg-blanco motion-safe:animate-[desliz_2.2s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        </section>

        <Canales />

        {/* Tres trabajos para entrar ahí mismo. */}
        <section
          aria-labelledby="destacados-titulo"
          className="border-t border-profundo"
          style={{ "--acento": ACENTO_CANAL.trabajos } as CSSProperties}
        >
          <div className="contenedor py-20 md:py-28">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p data-revelar className="flex items-center gap-3 font-michroma text-xs uppercase tracking-etiqueta text-acero">
                  <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
                  {INICIO.destacados.etiqueta}
                </p>
                <h2
                  id="destacados-titulo"
                  data-revelar
                  className="mt-5 titulo text-3xl leading-tight text-blanco md:text-5xl"
                >
                  {INICIO.destacados.titulo}
                </h2>
              </div>
              <Link
                href="/trabajos"
                transitionTypes={["canal-adelante"]}
                className="group inline-flex items-center gap-3 border border-profundo px-5 py-3 font-plex text-xs font-medium uppercase tracking-etiqueta text-blanco transition-colors hover:border-[var(--acento)]"
              >
                {INICIO.destacados.verTodos}
                <span className="text-acero">{PROYECTOS.length}</span>
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
            <div className="mt-10">
              <Vitrina proyectos={DESTACADOS} conFiltros={false} />
            </div>
          </div>
        </section>

        {/* El cierre: una sola pregunta y un botón. */}
        <section className="border-t border-profundo" style={{ "--acento": ACENTO_CANAL.contacto } as CSSProperties}>
          <div className="contenedor py-20 md:py-28">
            <div className="relative overflow-hidden rounded-[16px] border border-profundo px-7 py-12 md:px-14 md:py-20">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 60% 90% at 90% 100%, color-mix(in srgb, var(--acento) 18%, transparent), transparent 70%)",
                }}
              />
              <h2 data-revelar className="relative max-w-2xl titulo text-3xl leading-tight text-blanco md:text-5xl">
                {INICIO.cierre.titulo}
              </h2>
              <p data-revelar className="relative mt-5 max-w-xl font-lectura text-base leading-relaxed text-acero md:text-lg">
                {INICIO.cierre.texto}
              </p>
              <Link
                href="/contacto"
                transitionTypes={["canal-adelante"]}
                className="relative mt-9 inline-flex h-12 items-center justify-center gap-3 bg-blanco px-7 font-plex text-[13px] font-medium uppercase tracking-[0.14em] text-negro transition-colors hover:bg-acero"
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
