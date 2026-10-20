"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { Logotipo } from "@/componentes/marca/Logotipo";
import { ACENTO_CANAL, ACENTO_NICHO, AURORA } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import { salir } from "@/servidor/cuenta/acciones";

/**
 * El encabezado del panel: la firma, las secciones y quién está adentro.
 * En el celular las secciones van en una segunda fila que se desliza de
 * costado. Mide lo mismo siempre (--alto-panel), así la bandeja puede
 * ocupar justo el resto de la pantalla.
 */
export function EncabezadoPanel({ nombre }: { nombre: string }) {
  const ruta = usePathname();
  const actual = (destino: string) => (destino === "/panel" ? ruta === "/panel" : ruta.startsWith(destino));

  return (
    <header className="sticky top-0 z-40 border-b border-profundo bg-negro/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/panel" aria-label={PANEL_ADMIN.titulo} className="flex shrink-0 items-center gap-3">
            <Logotipo idGradiente="q-panel" className="text-[12px]" />
            <span className="hidden font-plex text-[11px] uppercase tracking-etiqueta text-acero sm:inline">
              {PANEL_ADMIN.titulo}
            </span>
          </Link>
          <nav aria-label={PANEL_ADMIN.titulo} className="hidden md:block">
            <Secciones actual={actual} />
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3 font-plex text-[11px] uppercase tracking-[0.14em]">
          <span className="hidden normal-case tracking-normal text-blanco lg:inline">{nombre}</span>
          <Link href="/cuenta" className="text-acero hover:text-blanco">
            {PANEL_ADMIN.miCuenta}
          </Link>
          <Link href="/" className="hidden text-acero hover:text-blanco sm:inline">
            {PANEL_ADMIN.verWeb}
          </Link>
          <form action={salir}>
            <button type="submit" className="border border-profundo px-3 py-1.5 text-acero transition-colors hover:text-blanco">
              {PANEL_ADMIN.salir}
            </button>
          </form>
        </div>
      </div>
      <nav aria-label={PANEL_ADMIN.titulo} className="overflow-x-auto border-t border-profundo px-4 md:hidden">
        <Secciones actual={actual} />
      </nav>
    </header>
  );
}

/** Un acento por sección (de la paleta de colores.ts): el punto y la línea de abajo. */
const ACENTO_SECCION: Record<string, string> = {
  "/panel": AURORA[0],
  "/panel/plantillas": ACENTO_NICHO.industria,
  "/panel/nucleos": ACENTO_NICHO.pymes,
  "/panel/objetivos": ACENTO_NICHO.holistica,
  "/panel/mapa": ACENTO_CANAL.contacto,
  "/panel/mensajes": ACENTO_CANAL.trabajos,
};

function Secciones({ actual }: { actual: (ruta: string) => boolean }) {
  return (
    <ul className="flex h-11 items-stretch gap-5 md:h-14">
      {PANEL_ADMIN.secciones.map((seccion) => (
        <li key={seccion.ruta} className="flex">
          <Link
            href={seccion.ruta}
            aria-current={actual(seccion.ruta) ? "page" : undefined}
            style={{ "--acento": ACENTO_SECCION[seccion.ruta] ?? "#ececee" } as CSSProperties}
            className="group relative flex items-center gap-2 whitespace-nowrap font-plex text-xs font-medium uppercase tracking-etiqueta text-acero transition-colors hover:text-blanco aria-[current=page]:text-blanco"
          >
            {/* El punto aparece al pasar (y queda en la actual); la línea crece desde la izquierda. */}
            <span aria-hidden className="size-1.5 scale-0 bg-(--acento) transition-transform duration-300 group-hover:scale-100 group-aria-[current=page]:scale-100" />
            {seccion.nombre}
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-(--acento) transition-transform duration-300 ease-(--ease-quvant) group-hover:scale-x-100 group-aria-[current=page]:scale-x-100" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
