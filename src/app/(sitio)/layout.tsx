import type { ReactNode } from "react";
import { ChatQuvant } from "@/componentes/chat/ChatQuvant";
import { MedirRubros } from "@/componentes/medicion/MedirRubros";
import { DockCanales } from "@/componentes/estructura/DockCanales";
import { Encabezado } from "@/componentes/estructura/Encabezado";
import { FocoTactil } from "@/componentes/estructura/FocoTactil";
import { PausaFueraDeVista } from "@/componentes/estructura/PausaFueraDeVista";
import { Pie } from "@/componentes/estructura/Pie";
import { Revelar } from "@/componentes/estructura/Revelar";
import { ScrollSuave } from "@/componentes/estructura/ScrollSuave";
import { ACCESIBILIDAD } from "@/datos/textos";

/**
 * El sitio público: todo lo que rodea a cada página (encabezado, pie,
 * barra de canales del celular, cursor propio, scroll suave, apariciones y
 * el chat "Hablemos ahora"). Devuelve hermanos directos de <body>: el
 * visor del portfolio busca "body > header" y "body > footer" para
 * dejarlos inertes.
 */
export default function LayoutSitio({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:bg-blanco focus:px-4 focus:py-2 focus:font-plex focus:text-sm focus:text-negro"
      >
        {ACCESIBILIDAD.saltarAlContenido}
      </a>
      <ScrollSuave />
      <Revelar />
      <FocoTactil />
      <PausaFueraDeVista />
      <MedirRubros />
      <Encabezado />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Pie />
      <DockCanales />
      <ChatQuvant />
    </>
  );
}
