"use client";

import "lenis/dist/lenis.css";
import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Scroll suave con Lenis para toda la página.
 * - Con prefers-reduced-motion no se inicializa: queda el scroll nativo.
 * - Los clics en anclas internas pasan por lenis.scrollTo, que ya respeta
 *   el scroll-padding-top del CSS (el aire debajo del menú fijo).
 * - El salto al contenido (#contenido) queda nativo a propósito: su razón
 *   de ser es mover el foco, y eso lo hace el navegador.
 */
export function ScrollSuave() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: true });

    const alClickear = (evento: MouseEvent) => {
      if (evento.defaultPrevented) return;
      const origen = evento.target as HTMLElement | null;
      const ancla = origen?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!ancla) return;
      const destino = ancla.getAttribute("href");
      if (!destino || destino === "#" || destino === "#contenido") return;
      if (!document.querySelector(destino)) return;
      evento.preventDefault();
      history.pushState(null, "", destino);
      lenis.scrollTo(destino);
    };

    document.addEventListener("click", alClickear);
    return () => {
      document.removeEventListener("click", alClickear);
      lenis.destroy();
    };
  }, []);

  return null;
}
