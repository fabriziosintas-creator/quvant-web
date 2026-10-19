"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { IconoCanal } from "@/componentes/canales/IconoCanal";
import { tipoTransicion } from "@/componentes/canales/navegacion";
import { IsotipoQ } from "@/componentes/marca/IsotipoQ";
import { ACENTO_CANAL, type IdCanal } from "@/datos/colores";
import { ACCESIBILIDAD, CANALES, NAVEGACION } from "@/datos/textos";

/** Cuatro canales y la Q al medio (el inicio). Contacto está arriba, en "Hablemos". */
const IZQUIERDA = CANALES.filter((canal) => canal.id === "trabajos" || canal.id === "servicios");
const DERECHA = CANALES.filter((canal) => canal.id === "plataformas" || canal.id === "nosotros");

/**
 * La barra de canales del celular, abajo y al alcance del pulgar, como en
 * una app: el canal actual se enciende con su color y una línea arriba.
 * Va translúcida y separada de los bordes; respeta la zona segura del
 * teléfono. En la computadora no existe: ahí están en el encabezado.
 */
export function DockCanales() {
  const ruta = usePathname();

  const item = (canal: (typeof CANALES)[number]) => {
    const activo = ruta === canal.ruta;
    return (
      <li key={canal.id} className="min-w-0">
        <Link
          href={canal.ruta}
          aria-current={activo ? "page" : undefined}
          transitionTypes={[tipoTransicion(ruta, canal.ruta)]}
          style={{ "--acento": ACENTO_CANAL[canal.id as IdCanal] } as CSSProperties}
          className={`relative flex h-full flex-col items-center justify-center gap-1 rounded-[10px] px-1 py-2 transition-colors ${
            activo ? "bg-profundo/70 text-blanco" : "text-acero active:bg-profundo/50"
          }`}
        >
          <span
            aria-hidden
            className={`absolute left-1/2 top-0 h-[2px] -translate-x-1/2 bg-[var(--acento)] transition-[width] duration-300 ${
              activo ? "w-6" : "w-0"
            }`}
          />
          <IconoCanal id={canal.id as IdCanal} className={`size-5 ${activo ? "text-[var(--acento)]" : ""}`} />
          <span className="max-w-full truncate font-plex text-[10px] font-medium uppercase tracking-[0.08em]">
            {canal.corto}
          </span>
        </Link>
      </li>
    );
  };

  const enInicio = ruta === "/";

  return (
    <nav
      aria-label={NAVEGACION.navCelular}
      data-dock
      style={{ viewTransitionName: "dock" }}
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 md:hidden"
    >
      <ul className="grid grid-cols-5 gap-1 rounded-[16px] border border-profundo bg-negro/85 p-1.5 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.95)] backdrop-blur-md">
        {IZQUIERDA.map(item)}
        <li>
          <Link
            href="/"
            aria-label={ACCESIBILIDAD.irAlInicio}
            aria-current={enInicio ? "page" : undefined}
            transitionTypes={[tipoTransicion(ruta, "/")]}
            className={`flex h-full flex-col items-center justify-center gap-1 rounded-[10px] py-2 transition-colors ${
              enInicio ? "bg-profundo/70 text-blanco" : "text-acero active:bg-profundo/50"
            }`}
          >
            <IsotipoQ idGradiente="q-dock" className="size-6" />
            <span className="font-plex text-[10px] font-medium uppercase tracking-[0.08em]">
              {NAVEGACION.inicio}
            </span>
          </Link>
        </li>
        {DERECHA.map(item)}
      </ul>
    </nav>
  );
}
