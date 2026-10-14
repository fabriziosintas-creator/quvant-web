"use client";

import "lenis/dist/lenis.css";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { useVista } from "@/estado/vista";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Scroll suave con Lenis, sincronizado con ScrollTrigger según la receta
 * oficial del README de Lenis (Lenis corre dentro del ticker de GSAP).
 * - Solo corre en vista 3D: la vista texto (que ya cubre el caso de
 *   prefers-reduced-motion) deja el scroll nativo, y al cambiar de vista
 *   se prende o se apaga en el momento.
 * - Los clics en anclas internas pasan por lenis.scrollTo, que ya respeta
 *   el scroll-padding-top del CSS (el aire debajo del menú fijo).
 * - El salto al contenido (#contenido) queda nativo a propósito: su razón
 *   de ser es mover el foco, y eso lo hace el navegador.
 */
export function ScrollSuave() {
  const vista = useVista();

  useEffect(() => {
    if (vista !== "3d") return;

    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    const tic = (tiempo: number) => lenis.raf(tiempo * 1000);
    gsap.ticker.add(tic);
    gsap.ticker.lagSmoothing(0);

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
      gsap.ticker.remove(tic);
      lenis.destroy();
    };
  }, [vista]);

  return null;
}
