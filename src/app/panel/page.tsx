import type { Metadata } from "next";
import { PanelMensajes } from "@/componentes/panel/PanelMensajes";
import { PANEL } from "@/datos/textos";

/**
 * El panel de mensajes del equipo: la bandeja de las charlas del chat de
 * la web. Es interno: sin el encabezado del sitio, fuera del sitemap y
 * de los buscadores (robots.ts también lo cierra).
 */
export const metadata: Metadata = {
  title: `${PANEL.titulo} · Quvant`,
  robots: { index: false, follow: false },
};

export default function Panel() {
  return <PanelMensajes />;
}
