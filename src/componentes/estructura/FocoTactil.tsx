"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * En pantallas táctiles no existe "pasar el mouse". Lo que en la
 * computadora se enciende al pasar por encima y lleva [data-foco-tactil]
 * acá se enciende cuando queda en el medio de la pantalla: recibe
 * data-en-foco="si" y el CSS lo trata igual que el hover
 * (group-data-[en-foco=si]:…).
 */
export function FocoTactil() {
  const ruta = usePathname();

  useEffect(() => {
    if (!window.matchMedia("(hover: none)").matches) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          (entrada.target as HTMLElement).dataset.enFoco = entrada.isIntersecting ? "si" : "no";
        }
      },
      { rootMargin: "-35% 0px -35% 0px" },
    );
    for (const elemento of document.querySelectorAll<HTMLElement>("[data-foco-tactil]")) {
      observador.observe(elemento);
    }
    return () => observador.disconnect();
  }, [ruta]);

  return null;
}
