import Link from "next/link";
import { AuroraFondo } from "@/componentes/estructura/AuroraFondo";
import { EntradaPromo } from "@/componentes/promo/EntradaPromo";
import { urlInstagram, CONTACTO } from "@/datos/contacto";
import { CANALES, MARCA, PIE } from "@/datos/textos";

/**
 * Pie de página. Arriba, el cierre: QUVANT gigante en Michroma a todo el
 * ancho, letra por letra en cascada al llegar (la Q vuelve como trofeo,
 * como pedía el estudio). Es la única firma del pie: abajo van la frase,
 * los canales, Instagram y los derechos.
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
      </div>

      <div className="contenedor grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr] md:py-20">
        <div className="flex flex-col gap-8">
          <p data-revelar className="flex items-start gap-3 font-plex text-sm text-acero md:text-base">
            <span aria-hidden className="mt-[0.45em] inline-block size-1.5 shrink-0 bg-blanco" />
            {MARCA.bajada}
          </p>
          <EntradaPromo origen="pie" className="max-w-sm" />
        </div>

        <nav aria-label={PIE.etiquetaSecciones} data-revelar>
          <p className="font-lectura text-sm font-medium text-acero">
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
          <p className="font-lectura text-sm font-medium text-acero">
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
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-plex text-xs text-acero">
            {PIE.derechos}
            <Link href="/privacidad" className="underline decoration-profundo underline-offset-4 hover:text-blanco hover:decoration-blanco">
              {PIE.privacidad}
            </Link>
          </p>
          <span aria-hidden className="hidden size-1.5 bg-acero lg:inline-block" />
        </div>
      </div>
    </footer>
  );
}
