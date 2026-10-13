"use client";

import { useEffect, useState } from "react";
import { Logotipo } from "@/componentes/marca/Logotipo";
import { ACCESIBILIDAD, MARCA, NAV } from "@/datos/textos";

/**
 * Menú fijo: firma horizontal a la izquierda, secciones a la derecha.
 * En pantallas chicas, botón hamburguesa con menú a pantalla completa.
 */
export function Encabezado() {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", alTeclear);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-profundo bg-negro">
      <div className="contenedor flex h-16 items-center justify-between md:h-20">
        <a href="#inicio" aria-label={ACCESIBILIDAD.irAlInicio} onClick={cerrar}>
          <Logotipo idGradiente="q-encabezado" className="text-[13px] md:text-[15px]" />
        </a>

        {/* Navegación de escritorio */}
        <nav aria-label={ACCESIBILIDAD.navPrincipal} className="hidden md:block">
          <ul className="flex items-center gap-9">
            {NAV.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="group font-plex text-xs font-medium uppercase tracking-etiqueta text-acero transition-colors hover:text-blanco focus-visible:text-blanco"
                >
                  <span className="mr-2 opacity-50 transition-opacity group-hover:opacity-100">
                    {item.numero}
                  </span>
                  {item.etiqueta}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Botón hamburguesa (solo en el celular) */}
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          aria-expanded={abierto}
          aria-controls="menu-movil"
          className="relative -mr-2 h-10 w-10 md:hidden"
        >
          <span className="sr-only">
            {abierto ? ACCESIBILIDAD.cerrarMenu : ACCESIBILIDAD.abrirMenu}
          </span>
          <span
            aria-hidden
            className={`absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 bg-blanco transition-transform duration-200 ${
              abierto ? "rotate-45" : "-translate-y-[4px]"
            }`}
          />
          <span
            aria-hidden
            className={`absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 bg-blanco transition-transform duration-200 ${
              abierto ? "-rotate-45" : "translate-y-[4px]"
            }`}
          />
        </button>
      </div>

      {/* Menú móvil a pantalla completa */}
      {abierto ? (
        <div id="menu-movil" className="fixed inset-x-0 bottom-0 top-16 z-40 bg-negro md:hidden">
          <nav
            aria-label={ACCESIBILIDAD.navPrincipal}
            className="contenedor flex h-full flex-col justify-between pb-10 pt-12"
          >
            <ul className="flex flex-col gap-8">
              {NAV.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} onClick={cerrar} className="group block">
                    <span className="block font-plex text-xs text-acero">{item.numero}</span>
                    <span className="mt-1 block font-michroma text-2xl uppercase tracking-marca text-blanco transition-colors group-hover:text-acero">
                      {item.etiqueta}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="flex items-center gap-3 font-plex text-xs text-acero">
              <span aria-hidden className="inline-block size-1.5 bg-blanco" />
              {MARCA.bajada}
            </p>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
