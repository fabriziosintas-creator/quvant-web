"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { CUENTA } from "@/datos/textos";
import { useVista } from "@/estado/vista";

const QRegistro = dynamic(() => import("./QRegistro"), { ssr: false });

const F = CUENTA.registro.pasos.ficha;
const CONSULTA_ANCHA = "(min-width: 1024px)";

function suscribirAncho(aviso: () => void) {
  const consulta = window.matchMedia(CONSULTA_ANCHA);
  consulta.addEventListener("change", aviso);
  return () => consulta.removeEventListener("change", aviso);
}

export type ItemFicha = { etiqueta: string; valor: string | null };

/**
 * La columna de al lado del registro, en computadora: la Q (de cromo en
 * WebGL; en SVG si la vista es texto) y la ficha que se arma mientras la
 * persona responde. Cada dato que se completa se enciende con el color
 * del rubro. En el celular no se dibuja: ahí manda la barra de progreso.
 * three.js se carga recién acá, y solo en pantallas anchas con vista 3D.
 */
export function FichaRegistro({ acento, paso, celebrar, items, conLugar }: { acento: string; paso: number; celebrar: boolean; items: ItemFicha[]; conLugar: boolean }) {
  const vista = useVista();
  // Pantalla ancha y equipo que no está marcado como liviano (data-liviano, ver introDecision).
  const ancha = useSyncExternalStore(
    suscribirAncho,
    () => window.matchMedia(CONSULTA_ANCHA).matches && document.documentElement.dataset.liviano !== "si",
    () => false,
  );

  return (
    <aside aria-label={F.titulo} className="ficha-registro sticky top-28 hidden flex-col gap-6 rounded-3xl border border-profundo p-6 lg:flex">
      <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[260px]">
        <div className="ficha-registro__resplandor absolute inset-[12%] rounded-full" />
        {vista === "3d" && ancha ? (
          <QRegistro acento={acento} paso={paso} celebrar={celebrar} activo />
        ) : vista === "texto" ? (
          <svg viewBox="0 0 105 105" className="relative size-full p-10">
            <defs>
              <linearGradient id="q-registro" gradientUnits="userSpaceOnUse" x1="8" y1="20" x2="97" y2="85">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="0.3333" stopColor="#3A3D42" />
                <stop offset="0.5" stopColor="#F2F4F6" />
                <stop offset="0.6667" stopColor="#6C7076" />
                <stop offset="1" stopColor="#9DA1A7" />
              </linearGradient>
            </defs>
            <circle cx="44" cy="44" r="31" fill="none" stroke="url(#q-registro)" strokeWidth="10" />
            <line x1="63" y1="63" x2="80" y2="80" stroke="url(#q-registro)" strokeWidth="10" />
            <rect x="86" y="86" width="11" height="11" fill="var(--acento-registro)" />
          </svg>
        ) : null}
      </div>
      <div>
        <p className="font-michroma text-[11px] uppercase tracking-marca text-blanco">{F.titulo}</p>
        <p className="mt-1 font-lectura text-sm text-acero">{F.bajada}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.etiqueta} data-listo={item.valor ? "si" : undefined} className="ficha-registro__item flex items-start gap-3">
            <span aria-hidden className="ficha-registro__marca mt-1 grid size-4 shrink-0 place-items-center rounded-full border border-profundo">
              <svg viewBox="0 0 12 12" className="size-2.5 fill-none stroke-negro" strokeWidth="2">
                <path d="M2.5 6.2 5 8.5l4.5-5" />
              </svg>
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">{item.etiqueta}</span>
              <span className="font-lectura text-sm text-blanco">{item.valor ?? <span className="text-acero/70">{F.pendiente}</span>}</span>
            </span>
          </li>
        ))}
        {conLugar ? (
          <li className="flex items-start gap-3 border-t border-profundo pt-3">
            <span aria-hidden className="mt-1 size-4 shrink-0 rounded-full border border-dashed border-acero/60" />
            <span className="flex min-w-0 flex-col">
              <span className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">{F.lugar}</span>
              <span className="font-lectura text-sm text-acero">{F.lugarTexto}</span>
            </span>
          </li>
        ) : null}
      </ul>
    </aside>
  );
}
