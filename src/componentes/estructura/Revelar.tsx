"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useVista } from "@/estado/vista";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Aparición al scroll de toda la página, en un solo lugar.
 *
 * Los componentes (de servidor, casi todos) solo marcan qué aparece:
 *   data-revelar            el elemento sube y se enciende al entrar
 *   data-revelar="grupo"    sus hijos directos aparecen en cascada
 *
 * El HTML del servidor llega con todo visible: sin JavaScript, o en vista
 * texto, no falta nada. Solo en vista 3D se ocultan los bloques (antes de
 * pintar, en un layout effect) y se van mostrando a medida que entran.
 * Cada bloque aparece una sola vez. Al cambiar de canal (otra página) se
 * vuelve a armar con los bloques nuevos.
 */
export function Revelar() {
  const vista = useVista();
  const ruta = usePathname();

  useLayoutEffect(() => {
    if (vista !== "3d") return;

    const contexto = gsap.context(() => {
      const simples = gsap.utils.toArray<HTMLElement>(
        '[data-revelar]:not([data-revelar="grupo"])',
      );
      gsap.set(simples, { opacity: 0, y: 26 });
      ScrollTrigger.batch(simples, {
        start: "top 88%",
        once: true,
        onEnter: (lote) =>
          gsap.to(lote, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.08,
            overwrite: true,
          }),
      });

      for (const grupo of gsap.utils.toArray<HTMLElement>('[data-revelar="grupo"]')) {
        const hijos = Array.from(grupo.children) as HTMLElement[];
        gsap.set(hijos, { opacity: 0, y: 18 });
        ScrollTrigger.create({
          trigger: grupo,
          start: "top 88%",
          once: true,
          onEnter: () =>
            gsap.to(hijos, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.06 }),
        });
      }
    });

    // Las imágenes que cargan después mueven la página: recalcular.
    const alCargar = () => ScrollTrigger.refresh();
    window.addEventListener("load", alCargar);

    return () => {
      window.removeEventListener("load", alCargar);
      contexto.revert();
    };
  }, [vista, ruta]);

  return null;
}
