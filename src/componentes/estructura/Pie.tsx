import Link from "next/link";
import { AuroraFondo } from "@/componentes/estructura/AuroraFondo";
import { InterruptorVista } from "@/componentes/estructura/InterruptorVista";
import { Logotipo } from "@/componentes/marca/Logotipo";
import { urlInstagram, CONTACTO } from "@/datos/contacto";
import { CANALES, MARCA, PIE } from "@/datos/textos";

/**
 * Pie de página. Arriba, el cierre: QUVANT gigante en Michroma a todo el
 * ancho, letra por letra en cascada al llegar (la Q vuelve como trofeo,
 * como pedía el estudio). Abajo, la firma, los canales, Instagram y los
 * derechos. En pantallas sin el interruptor 3D / texto arriba, va acá.
 */
export function Pie() {
  const letras = Array.from(MARCA.logotipo);

  return (
    <footer className="relative overflow-hidden border-t border-profundo">
      <AuroraFondo intensidad={0.4} />
      {/* El cierre: la marca a todo lo ancho. */}
      <div className="contenedor relative overflow-hidden pt-20 md:pt-28">
        <p
          aria-label={MARCA.logotipo}
          data-revelar="grupo"
          className="flex justify-between font-michroma text-[clamp(2.6rem,14.5vw,11.5rem)] leading-none text-blanco"
        >
          {letras.map((letra, indice) => (
            <span key={indice} aria-hidden className="inline-block">
              {letra}
            </span>
          ))}
        </p>
        <p
          data-revelar
          className="mt-6 flex items-center gap-3 font-plex text-sm text-acero md:text-base"
        >
          <span aria-hidden className="inline-block size-1.5 bg-blanco" />
          {MARCA.bajada}
        </p>
      </div>

      <div className="contenedor grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr] md:py-20">
        <div data-revelar>
          <Logotipo idGradiente="q-pie" className="text-[14px]" />
          <p className="mt-6 max-w-xs text-sm text-acero">{MARCA.pronunciacion}</p>
        </div>

        <nav aria-label={PIE.etiquetaSecciones} data-revelar>
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {PIE.etiquetaSecciones}
          </p>
          <ul className="mt-5 flex flex-col gap-3">
            {CANALES.map((canal) => (
              <li key={canal.id}>
                <Link
                  href={canal.ruta}
                  className="group inline-flex items-center gap-3 text-sm text-blanco transition-colors hover:text-acero"
                >
                  {/* El punto cuadrado reemplaza a la viñeta redonda (manual, sección 09). */}
                  <span
                    aria-hidden
                    className="inline-block size-1 bg-profundo transition-colors group-hover:bg-blanco"
                  />
                  {canal.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div data-revelar>
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {PIE.etiquetaSeguinos}
          </p>
          <ul className="mt-5">
            <li>
              <a
                href={urlInstagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 text-sm text-blanco transition-colors hover:text-acero"
              >
                <span
                  aria-hidden
                  className="inline-block size-1 bg-profundo transition-colors group-hover:bg-blanco"
                />
                Instagram · @{CONTACTO.instagram}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-profundo">
        <div className="contenedor flex items-center justify-between gap-4 py-5">
          <p className="font-plex text-xs text-acero">{PIE.derechos}</p>
          <InterruptorVista className="lg:hidden" />
          <span aria-hidden className="hidden size-1.5 bg-acero lg:inline-block" />
        </div>
      </div>
    </footer>
  );
}
