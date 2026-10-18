"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { tipoTransicion } from "@/componentes/canales/navegacion";
import { Logotipo } from "@/componentes/marca/Logotipo";
import { ACENTO_CANAL } from "@/datos/colores";
import { PROYECTOS } from "@/datos/portfolio";
import { ACCESIBILIDAD, CANALES, NAVEGACION } from "@/datos/textos";
import { InterruptorVista } from "./InterruptorVista";

/** Contacto va aparte, como botón: el resto son los canales de la píldora. */
const EN_LA_PILDORA = CANALES.filter((canal) => canal.id !== "contacto");
const CONTACTO = CANALES.find((canal) => canal.id === "contacto")!;

/** Al lado de cada canal, cuánto hay adentro (como los contadores de basement). */
const CONTADOR: Partial<Record<string, number>> = { trabajos: PROYECTOS.length };

/**
 * El encabezado fijo, translúcido.
 *
 * Computadora: la firma a la izquierda, los canales en una píldora al
 * centro (el actual en blanco, con su color) y a la derecha el interruptor
 * 3D / texto y "Hablemos".
 * Celular: la firma y "Hablemos". Los canales están en la barra de abajo
 * (DockCanales), al alcance del pulgar.
 *
 * Lleva su propio nombre de transición: al cambiar de canal la página se
 * desliza y el encabezado queda quieto (ver globals.css).
 */
export function Encabezado() {
  const ruta = usePathname();
  const enContacto = ruta === CONTACTO.ruta;

  return (
    <header
      style={{ viewTransitionName: "encabezado" }}
      className="fixed inset-x-0 top-0 z-50 border-b border-profundo/70 bg-negro/80 backdrop-blur-md"
    >
      <div className="contenedor flex h-16 items-center justify-between gap-4 md:h-20">
        <Link
          href="/"
          aria-label={ACCESIBILIDAD.irAlInicio}
          transitionTypes={[tipoTransicion(ruta, "/")]}
          className="shrink-0"
        >
          <Logotipo idGradiente="q-encabezado" className="text-[13px] lg:text-[16px]" />
        </Link>

        <nav aria-label={NAVEGACION.navPrincipal} className="hidden md:block">
          <ul className="flex items-center gap-0.5 rounded-full border border-profundo bg-profundo/30 p-1">
            {EN_LA_PILDORA.map((canal) => {
              const activo = ruta === canal.ruta;
              const cantidad = CONTADOR[canal.id];
              return (
                <li key={canal.id}>
                  <Link
                    href={canal.ruta}
                    aria-current={activo ? "page" : undefined}
                    transitionTypes={[tipoTransicion(ruta, canal.ruta)]}
                    style={{ "--acento": ACENTO_CANAL[canal.id] } as CSSProperties}
                    className={`group flex items-center gap-2 rounded-full px-3 py-2 font-plex text-[11px] font-medium uppercase tracking-etiqueta transition-colors lg:px-4 ${
                      activo ? "bg-blanco text-negro" : "text-acero hover:text-blanco"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`size-1.5 transition-colors ${
                        activo ? "bg-[var(--acento)]" : "bg-profundo group-hover:bg-[var(--acento)]"
                      }`}
                    />
                    {canal.nombre}
                    {cantidad ? (
                      <span className={`hidden lg:inline ${activo ? "text-negro/50" : "text-acero/60"}`}>
                        {cantidad}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <InterruptorVista corto className="hidden lg:flex" />
          <Link
            href={CONTACTO.ruta}
            aria-current={enContacto ? "page" : undefined}
            transitionTypes={[tipoTransicion(ruta, CONTACTO.ruta)]}
            className={`inline-flex h-9 items-center gap-2 px-4 font-plex text-[11px] font-medium uppercase tracking-[0.14em] transition-colors md:h-10 md:px-5 ${
              enContacto
                ? "border border-blanco text-blanco"
                : "bg-blanco text-negro hover:bg-acero"
            }`}
          >
            <span aria-hidden className="size-1.5" style={{ background: ACENTO_CANAL.contacto }} />
            {NAVEGACION.hablemos}
          </Link>
        </div>
      </div>
    </header>
  );
}
