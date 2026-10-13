import { EN_CONSTRUCCION, HERO } from "@/datos/textos";

/**
 * Página única del sitio. En esta fase, la portada es una versión estática
 * (la Q de cromo en 3D y la animación de tipeo llegan en las fases 2 y 3)
 * y las demás secciones son marcadores anclados para que el menú ya navegue.
 */
export default function Inicio() {
  return (
    <>
      <section id="inicio" className="flex min-h-svh flex-col justify-center pt-16">
        <div className="contenedor">
          {/* TODO (fase 2 y 3): la Q de cromo en 3D y el punto que avanza con el scroll. */}
          <h1 className="font-michroma text-[clamp(2.5rem,12.5vw,9rem)] leading-none tracking-marca text-blanco">
            {HERO.titulo}
          </h1>
          <p className="mt-7 max-w-xl font-plex text-sm text-acero md:text-base">
            {HERO.bajada}
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
        </div>
      </section>

      {/* TODO (fases 4 a 7): secciones reales de Nosotros, Plataformas, Webs y Contacto. */}
      {EN_CONSTRUCCION.map((seccion) => (
        <section key={seccion.id} id={seccion.id} className="border-t border-profundo">
          <div className="contenedor py-24 md:py-32">
            <p className="font-michroma text-xs uppercase tracking-etiqueta text-acero">
              {seccion.numero} · {seccion.titulo}
            </p>
            <p className="mt-5 flex items-center gap-3 font-plex text-sm text-acero">
              <span aria-hidden className="inline-block size-1 bg-profundo" />
              Sección en construcción.
            </p>
          </div>
        </section>
      ))}
    </>
  );
}
