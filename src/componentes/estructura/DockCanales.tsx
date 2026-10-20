"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { IconoCanal } from "@/componentes/canales/IconoCanal";
import { tipoTransicion } from "@/componentes/canales/navegacion";
import { abrirChat, useSinLeerChat } from "@/componentes/chat/ChatQuvant";
import { IsotipoQ } from "@/componentes/marca/IsotipoQ";
import { ACENTO_CANAL, type IdCanal } from "@/datos/colores";
import { CANALES, CHAT, NAVEGACION } from "@/datos/textos";

/** Cuatro canales y, al medio, la Q: el chat. Contacto está arriba, en "Hablemos"; el inicio, en el logo. */
const IZQUIERDA = CANALES.filter((canal) => canal.id === "trabajos" || canal.id === "servicios");
const DERECHA = CANALES.filter((canal) => canal.id === "plataformas" || canal.id === "nosotros");

/**
 * La barra de canales del celular, abajo y al alcance del pulgar, como en
 * una app: el canal actual se enciende con su color y una línea arriba.
 * La Q del medio abre el chat (en el celular no hay botón flotante: así no
 * tapa nada). Va translúcida y separada de los bordes; respeta la zona
 * segura del teléfono. En la computadora no existe: ahí están en el
 * encabezado.
 */
export function DockCanales() {
  const ruta = usePathname();
  const sinLeer = useSinLeerChat();

  const item = (canal: (typeof CANALES)[number]) => {
    const activo = ruta === canal.ruta;
    return (
      <li key={canal.id} className="min-w-0">
        <Link
          href={canal.ruta}
          aria-current={activo ? "page" : undefined}
          transitionTypes={[tipoTransicion(ruta, canal.ruta)]}
          style={{ "--acento": ACENTO_CANAL[canal.id as IdCanal] } as CSSProperties}
          className={`relative flex h-full flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-2 transition-colors ${
            activo ? "bg-profundo/70 text-blanco" : "text-acero active:bg-profundo/50"
          }`}
        >
          <span
            aria-hidden
            className={`absolute left-1/2 top-0 h-[2px] -translate-x-1/2 bg-[var(--acento)] transition-[width] duration-(--duracion-rapida) ${
              activo ? "w-6" : "w-0"
            }`}
          />
          <IconoCanal id={canal.id as IdCanal} className={`size-5 ${activo ? "text-[var(--acento)]" : ""}`} />
          <span className="max-w-full truncate font-lectura text-xs font-medium max-[380px]:tracking-normal">
            {canal.corto}
          </span>
        </Link>
      </li>
    );
  };

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
          <button
            type="button"
            onClick={() => abrirChat()}
            aria-label={sinLeer > 0 ? `${CHAT.abrir} (${sinLeer} ${CHAT.sinLeer})` : CHAT.abrir}
            className="relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl py-2 text-blanco active:bg-profundo/50"
          >
            <span className="relative">
              <IsotipoQ idGradiente="q-dock" className="size-6" />
              {/* El punto verde de "en línea", como en el botón de la computadora. */}
              <span
                aria-hidden
                className="absolute -right-1 -top-0.5 size-1.5 motion-safe:animate-[parpadeo_2.6s_ease-in-out_infinite]"
                style={{ background: ACENTO_CANAL.contacto }}
              />
            </span>
            <span className="font-lectura text-xs font-medium">{NAVEGACION.chat}</span>
            {sinLeer > 0 ? (
              <span
                aria-hidden
                className="absolute right-1.5 top-1 flex min-w-4 items-center justify-center rounded-full bg-blanco px-1 font-plex text-[10px] font-bold text-negro"
              >
                {sinLeer}
              </span>
            ) : null}
          </button>
        </li>
        {DERECHA.map(item)}
      </ul>
    </nav>
  );
}
