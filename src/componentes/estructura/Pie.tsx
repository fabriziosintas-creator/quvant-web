import { Logotipo } from "@/componentes/marca/Logotipo";
import { urlInstagram, CONTACTO } from "@/datos/contacto";
import { MARCA, NAV, PIE } from "@/datos/textos";

/** Pie de página: firma, bajada oficial, secciones, Instagram y derechos. */
export function Pie() {
  return (
    <footer className="border-t border-profundo">
      <div className="contenedor grid gap-12 py-14 md:grid-cols-[1.5fr_1fr_1fr] md:py-20">
        <div>
          <Logotipo idGradiente="q-pie" className="text-[14px]" />
          <p className="mt-6 max-w-xs text-sm text-acero">{MARCA.bajada}</p>
        </div>

        <nav aria-label={PIE.etiquetaSecciones}>
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {PIE.etiquetaSecciones}
          </p>
          <ul className="mt-5 flex flex-col gap-3">
            {NAV.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="group inline-flex items-center gap-3 text-sm text-blanco transition-colors hover:text-acero"
                >
                  {/* El punto cuadrado reemplaza a la viñeta redonda (manual, sección 09). */}
                  <span
                    aria-hidden
                    className="inline-block size-1 bg-profundo transition-colors group-hover:bg-blanco"
                  />
                  {item.etiqueta}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
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
        <div className="contenedor flex items-center justify-between py-5">
          <p className="font-plex text-xs text-acero">{PIE.derechos}</p>
          <span aria-hidden className="inline-block size-1.5 bg-acero" />
        </div>
      </div>
    </footer>
  );
}
