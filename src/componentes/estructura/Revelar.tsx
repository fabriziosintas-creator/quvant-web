"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useVista } from "@/estado/vista";
import { CURVA, DURACION } from "./movimiento";

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
 * La regla (decisión del 19-oct-2026): al llegar, el contenido ya está.
 * Lo que entra en la primera pantalla no se oculta nunca: la página llega
 * deslizándose y eso ya es el movimiento. Lo de más abajo empieza a
 * aparecer justo antes de asomar por el borde, corto y con poco recorrido,
 * así que al bajar rápido (o al saltar a un capítulo) nunca se ve una
 * pantalla vacía.
 *
 * El HTML del servidor llega con todo visible: sin JavaScript, o en vista
 * texto, no falta nada. Cada bloque aparece una sola vez. Al cambiar de
 * canal (otra página) se vuelve a armar con los bloques nuevos.
 */

/** Ya está en la primera pantalla: queda como está. */
const enPantalla = (elemento: HTMLElement) => elemento.getBoundingClientRect().top < window.innerHeight;

/** Un poco antes de asomar: al bajar, el bloque ya viene apareciendo (nunca se ve vacío). */
const COMIENZO = "top bottom+=80";

export function Revelar() {
  const vista = useVista();
  const ruta = usePathname();

  useLayoutEffect(() => {
    if (vista !== "3d") return;

    const contexto = gsap.context(() => {
      const simples = gsap.utils
        .toArray<HTMLElement>('[data-revelar]:not([data-revelar="grupo"])')
        .filter((elemento) => !enPantalla(elemento));
      gsap.set(simples, { opacity: 0, y: 20 });
      ScrollTrigger.batch(simples, {
        start: COMIENZO,
        once: true,
        onEnter: (lote) =>
          gsap.to(lote, {
            opacity: 1,
            y: 0,
            duration: DURACION.lenta,
            ease: CURVA.entrar,
            stagger: 0.1,
            overwrite: true,
          }),
      });

      for (const grupo of gsap.utils.toArray<HTMLElement>('[data-revelar="grupo"]')) {
        if (enPantalla(grupo)) continue;
        const hijos = Array.from(grupo.children) as HTMLElement[];
        gsap.set(hijos, { opacity: 0, y: 16 });
        ScrollTrigger.create({
          trigger: grupo,
          start: COMIENZO,
          once: true,
          onEnter: () =>
            gsap.to(hijos, {
              opacity: 1,
              y: 0,
              duration: DURACION.lenta,
              ease: CURVA.entrar,
              stagger: 0.1,
            }),
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
