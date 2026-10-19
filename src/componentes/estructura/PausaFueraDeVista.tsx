"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Los adornos que se mueven en bucle con CSS (el brillo de fondo, la cinta
 * de rubros) llevan [data-pausable]. Mientras no se ven, sus animaciones
 * quedan en pausa (data-pausa="si", ver globals.css): el navegador no
 * gasta cuadros en lo que nadie mira, cosa que en un celular de gama
 * media se nota.
 */
export function PausaFueraDeVista() {
  const ruta = usePathname();

  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          (entrada.target as HTMLElement).dataset.pausa = entrada.isIntersecting ? "no" : "si";
        }
      },
      { rootMargin: "100px 0px" },
    );
    for (const elemento of document.querySelectorAll<HTMLElement>("[data-pausable]")) {
      observador.observe(elemento);
    }
    return () => observador.disconnect();
  }, [ruta]);

  return null;
}
