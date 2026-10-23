"use client";

import type { CSSProperties, ReactNode } from "react";
import { abrirChat } from "@/componentes/chat/ChatQuvant";
import { GrillaLuz } from "@/componentes/estructura/GrillaLuz";
import { ACENTO_NICHO, AURORA } from "@/datos/colores";
import { CONTACTO, urlEmail, urlInstagram, urlWhatsApp } from "@/datos/contacto";
import { CHAT, CONTACTO_SECCION } from "@/datos/textos";

const D = CONTACTO_SECCION.directo;
/** Mientras el email de la web sea el de ejemplo, su tarjeta no se muestra (mandaría a una casilla que no existe). */
const HAY_EMAIL = !CONTACTO.email.endsWith("@tudominio.com");

const ICONOS: Record<string, ReactNode> = {
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  whatsapp: (
    <>
      <path d="M4 20l1.4-4.2A8 8 0 1 1 8.2 18.6z" />
      <path d="M9 9.5c.5 2 2.5 4 4.5 4.5l1-1.5 2 1-.5 1.5c-3 .5-7.5-4-7-7l1.5-.5 1 2z" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="16.8" cy="7.2" r="0.6" fill="currentColor" />
    </>
  ),
  email: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
};

type Via = { id: keyof typeof ICONOS; titulo: string; valor: string; color: string; url?: string };

const VIAS: Via[] = [
  { id: "chat", titulo: D.chat, valor: CHAT.abrirDesdeContacto, color: "#7BD389" },
  { id: "whatsapp", titulo: D.filas.whatsapp, valor: CONTACTO.whatsappVisible, color: AURORA[0], url: urlWhatsApp() },
  { id: "instagram", titulo: D.filas.instagram, valor: `@${CONTACTO.instagram}`, color: ACENTO_NICHO.holistica, url: urlInstagram },
  ...(HAY_EMAIL ? [{ id: "email", titulo: D.filas.email, valor: CONTACTO.email, color: AURORA[1], url: urlEmail } as Via] : []),
];

function Contenido({ via }: { via: Via }) {
  return (
    <>
      <span className="flex items-center justify-between gap-4">
        <span aria-hidden className="flex size-11 items-center justify-center rounded-full bg-[var(--acento)] text-negro shadow-[0_0_28px_-6px_var(--acento)]">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            {ICONOS[via.id]}
          </svg>
        </span>
        <span aria-hidden className="font-plex text-lg text-acero transition-[color,translate] duration-(--duracion-rapida) group-hover:translate-x-0.5 group-hover:text-blanco">
          {via.url ? "↗" : "→"}
        </span>
      </span>
      <span className="mt-auto flex flex-col gap-1.5 pt-6">
        <span className="titulo text-2xl leading-none text-blanco">{via.titulo}</span>
        <span className="font-plex text-sm text-[var(--acento)]">{via.valor}</span>
        <span className="font-lectura text-sm leading-snug text-acero">{D.detalles[via.id as keyof typeof D.detalles]}</span>
      </span>
    </>
  );
}

/**
 * Las vías directas del contacto, como tarjetas de luz (el mismo lenguaje
 * que las situaciones de la promo): cada una con su color, un círculo con
 * su ícono y el dato a la vista. El chat abre "Hablemos ahora"; las demás,
 * WhatsApp, Instagram o el email en otra pestaña.
 */
export function ViasDirectas() {
  return (
    <GrillaLuz className="grid gap-4 sm:grid-cols-2">
      {VIAS.map((via, i) => {
        // Si quedan impares, la primera (el chat) va a lo ancho y no queda una sola abajo.
        const clase = `group tarjeta-luz entra-luz flex min-h-44 flex-col p-5 text-left md:p-6 ${i === 0 && VIAS.length % 2 === 1 ? "sm:col-span-2" : ""}`;
        return via.url ? (
          <a key={via.id} href={via.url} target="_blank" rel="noopener noreferrer" className={clase} style={{ "--acento": via.color } as CSSProperties}>
            <Contenido via={via} />
          </a>
        ) : (
          <button key={via.id} type="button" onClick={() => abrirChat()} className={clase} style={{ "--acento": via.color } as CSSProperties}>
            <Contenido via={via} />
          </button>
        );
      })}
    </GrillaLuz>
  );
}
