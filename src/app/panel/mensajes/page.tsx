import type { Metadata } from "next";
import { PanelMensajes } from "@/componentes/panel/PanelMensajes";
import { PANEL, PANEL_ADMIN } from "@/datos/textos";

export const metadata: Metadata = {
  title: `${PANEL.bandeja} · ${PANEL_ADMIN.titulo} · Quvant`,
  robots: { index: false, follow: false },
};

/** La bandeja del chat "Hablemos ahora", dentro del panel (el layout ya verificó que sea admin). */
export default function Mensajes() {
  return <PanelMensajes />;
}
