import { QCromoDiferido } from "@/componentes/3d/QCromoDiferido";
import { AuroraFondo } from "@/componentes/estructura/AuroraFondo";
import { CintaRubros } from "@/componentes/estructura/CintaRubros";
import { TextoTipeado } from "@/componentes/estructura/TextoTipeado";
import { Contacto } from "@/componentes/secciones/Contacto";
import { Nosotros } from "@/componentes/secciones/Nosotros";
import { Plataformas } from "@/componentes/secciones/Plataformas";
import { Webs } from "@/componentes/secciones/Webs";
import { DatosEstructurados } from "@/componentes/seo/DatosEstructurados";
import { HERO } from "@/datos/textos";

/** Página única del sitio: portada con la Q de cromo y las cinco secciones. */
export default function Inicio() {
  return (
    <>
      <DatosEstructurados />
      <section
        id="inicio"
        className="relative flex min-h-svh flex-col justify-end overflow-hidden pb-24 pt-16 md:justify-center md:pb-0"
      >
        <QCromoDiferido />
        <AuroraFondo />
        <div className="contenedor relative z-10">
          <h1 className="font-michroma text-[clamp(2.5rem,13vw,4.75rem)] leading-none tracking-marca text-blanco md:text-[clamp(4.75rem,8vw,8.5rem)]">
            {HERO.titulo}
          </h1>
          <p className="mt-7 max-w-xl font-plex text-sm text-acero md:text-base">
            <TextoTipeado texto={HERO.bajada} />
          </p>
          <div className="mt-11 flex flex-wrap gap-4">
            <a
              href={HERO.botonPrimario.destino}
              className="inline-flex h-12 items-center justify-center bg-blanco px-7 font-plex text-[13px] font-medium uppercase tracking-[0.14em] text-negro transition-colors hover:bg-acero"
            >
              {HERO.botonPrimario.texto}
            </a>
            <a
              href={HERO.botonSecundario.destino}
              className="inline-flex h-12 items-center justify-center border border-profundo px-7 font-plex text-[13px] font-medium uppercase tracking-[0.14em] text-blanco transition-colors hover:border-acero"
            >
              {HERO.botonSecundario.texto}
            </a>
          </div>
          <CintaRubros />
        </div>

        {/* Pista de scroll: el punto cuadrado bajando por un riel fino. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-9 z-10">
          <div className="contenedor flex justify-end">
            <div className="relative h-9 w-px bg-profundo">
              <span className="absolute -left-[2.5px] top-0 size-1.5 bg-blanco motion-safe:animate-[desliz_2.2s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      </section>

      <Nosotros />
      <Plataformas />
      <Webs />
      <Contacto />
    </>
  );
}
