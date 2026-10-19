"use client";

import { CHAT } from "@/datos/textos";
import { abrirChat } from "./ChatQuvant";

/** Un botón que abre el chat "Hablemos ahora" (para usar dentro de páginas del servidor). */
export function BotonAbrirChat({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => abrirChat()}
      className={`inline-flex h-11 items-center justify-center gap-3 border border-[#7BD389]/70 px-5 font-plex text-[11px] font-medium uppercase tracking-[0.14em] text-blanco transition-colors hover:border-[#7BD389] ${className}`}
    >
      <span aria-hidden className="size-1.5 bg-[#7BD389] motion-safe:animate-[parpadeo_1.6s_steps(2,end)_infinite]" />
      {CHAT.abrirDesdeContacto}
    </button>
  );
}
