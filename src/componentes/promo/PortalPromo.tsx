"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, ViewTransition } from "react";
import { medir } from "@/componentes/medicion/medir";
import { PROMO, PROMO_TEXTOS } from "@/datos/promo";

const T = PROMO_TEXTOS.portal;

/** A la página de la promo, arriba: el contador; desde ahí, "Deslizá y mirá el video" invita a bajar. */
export const DESTINO_PORTAL = `${PROMO.ruta}?utm_source=portada`;
/** Lo que dura el "encendido" antes de navegar (sin movimiento: nada). */
const ENCENDIDO_MS = 460;

export type EstadoPortal = "abierta" | "pronto" | "llena";

/**
 * El botón de "Primeros 100" en la portada, debajo de la cinta de rubros.
 *
 * Al tocarlo se "enciende" (una onda que sale del play, una luz que lo
 * barre y el borde que se ilumina) y después navega a la página de la
 * promo con el tipo de transición "portal-promo": la cápsula se estira
 * hasta convertirse en el contador de lugares (el mismo nombre de
 * <ViewTransition> en la página); abajo, "Deslizá y mirá el video"
 * (IrAlVideo) invita a bajar hasta el video.
 *
 * Es un link de verdad: sin JavaScript, con Ctrl/Cmd o con la rueda
 * abre la página normalmente. Con "menos movimiento" navega directo.
 * Lo visual vive en globals.css (.portal-promo).
 */
export function PortalPromo({ estado, quedan, tope }: { estado: EstadoPortal; quedan: number; tope: number }) {
  const router = useRouter();
  const [encendido, setEncendido] = useState(false);
  const yendo = useRef(false);

  const tocar = (evento: React.MouseEvent<HTMLAnchorElement>) => {
    if (evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    if (yendo.current) return;
    yendo.current = true;
    medir("clic_cinta_promo");
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEncendido(true);
    window.setTimeout(() => router.push(DESTINO_PORTAL, { transitionTypes: ["portal-promo"] }), quieto ? 0 : ENCENDIDO_MS);
  };

  const chip = T.estados[estado].replace("{n}", String(quedan)).replace("{tope}", String(tope));

  return (
    <ViewTransition name="portal-promo" share="portal-promo" default="none">
      <Link href={DESTINO_PORTAL} onClick={tocar} data-encendido={encendido ? "si" : undefined} className="portal-promo mt-10 md:mt-12">
        <span aria-hidden className="portal-promo__halo" />
        <span className="portal-promo__cuerpo">
          <span aria-hidden className="portal-promo__play">
            <svg viewBox="0 0 24 24" className="size-4 translate-x-px fill-current">
              <path d="M8 5.5v13a.6.6 0 0 0 .92.5l10.2-6.5a.6.6 0 0 0 0-1L8.92 5a.6.6 0 0 0-.92.5Z" />
            </svg>
            <span className="portal-promo__onda" />
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-michroma text-[11px] uppercase tracking-marca text-blanco">{T.etiqueta}</span>
              <span className="portal-promo__chip font-plex text-[10px] uppercase tracking-etiqueta">{chip}</span>
            </span>
            <span className="mt-0.5 titulo text-[19px] leading-[1.2] text-blanco md:text-2xl">
              <span className="portal-promo__resalte">{T.resalte}</span> {T.titulo}
            </span>
            <span className="font-lectura text-[13px] leading-snug text-blanco/85 md:text-sm">{T.texto}</span>
            <span className="font-lectura text-[11px] leading-snug text-acero md:text-xs">{T.nota}</span>
          </span>
          <span className="portal-promo__accion font-lectura text-sm font-medium max-sm:hidden">
            <span className="hidden md:inline">{T.accion}</span>
            <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-none stroke-current" strokeWidth="1.8">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
          <span aria-hidden className="portal-promo__barrido" />
        </span>
      </Link>
    </ViewTransition>
  );
}
