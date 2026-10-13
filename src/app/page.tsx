import { QCromoDiferido } from "@/componentes/3d/QCromoDiferido";
import { EN_CONSTRUCCION, HERO } from "@/datos/textos";

/**
 * Página única del sitio. La portada ya tiene la Q de cromo en 3D (fase 2);
 * la animación de tipeo y el punto que avanza con el scroll llegan en la
 * fase 3, y las demás secciones son marcadores anclados.
 */
export default function Inicio() {
  return (
    <>
      <section
        id="inicio"
        className="relative flex min-h-svh flex-col justify-end overflow-hidden pb-24 pt-16 md:justify-center md:pb-0"
      >
        <QCromoDiferido />
        <div className="contenedor relative z-10">
          <h1 className="font-michroma text-[clamp(2.5rem,13vw,4.75rem)] leading-none tracking-marca text-blanco md:text-[clamp(4.75rem,8vw,8.5rem)]">
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
