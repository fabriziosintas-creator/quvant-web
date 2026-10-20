"use client";

import { useEffect } from "react";
import { medir } from "./medir";

/**
 * Mide la web pública sin tocar los componentes que ya existen:
 *  · cuando un rubro entra en pantalla y queda (más de la mitad visible
 *    durante un segundo), vista_nicho. Vale para los paneles del selector
 *    (data-nicho en su panel) y para cualquier bloque marcado con
 *    data-medir-nicho="<id>".
 *  · clic en un enlace marcado data-medir="demo" o "contacto" (con
 *    data-nicho si es de un rubro): clic_demo / clic_contacto.
 * Un rubro se cuenta una vez por carga de página; la base además lo
 * limita a una vez cada 30 minutos por visita.
 */
export function MedirRubros() {
  useEffect(() => {
    const vistos = new Set<string>();
    const temporizadores = new Map<Element, ReturnType<typeof setTimeout>>();

    // "Está mirando el rubro": más de la mitad del bloque a la vista o, si el
    // bloque es más alto que la pantalla (celular), más de media pantalla de él.
    const aLaVista = (entrada: IntersectionObserverEntry) =>
      entrada.isIntersecting &&
      (entrada.intersectionRatio >= 0.5 || entrada.intersectionRect.height >= window.innerHeight * 0.5);

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          const nicho = (entrada.target as HTMLElement).dataset.medirNicho ?? (entrada.target as HTMLElement).dataset.nicho;
          if (!nicho || vistos.has(nicho)) continue;
          const pendiente = temporizadores.get(entrada.target);
          if (aLaVista(entrada) && !pendiente) {
            temporizadores.set(
              entrada.target,
              setTimeout(() => {
                temporizadores.delete(entrada.target);
                if (vistos.has(nicho)) return;
                vistos.add(nicho);
                medir("vista_nicho", nicho);
              }, 1000),
            );
          } else if (!aLaVista(entrada) && pendiente) {
            clearTimeout(pendiente);
            temporizadores.delete(entrada.target);
          }
        }
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75] },
    );

    const observar = () => {
      document.querySelectorAll<HTMLElement>("[data-medir-nicho], [role=tabpanel][data-nicho]").forEach((el) => {
        // Un panel oculto (hidden) no mide hasta que se muestre: el observador lo nota solo.
        observador.observe(el);
      });
    };
    observar();
    // Los paneles de rubros cambian con las pestañas y las páginas con la navegación.
    const mutaciones = new MutationObserver(observar);
    mutaciones.observe(document.body, { childList: true, subtree: true });

    const alTocar = (evento: MouseEvent) => {
      const enlace = (evento.target as Element | null)?.closest<HTMLElement>("[data-medir]");
      if (!enlace) return;
      const que = enlace.dataset.medir;
      if (que === "demo") medir("clic_demo", enlace.dataset.nicho);
      if (que === "contacto") medir("clic_contacto", enlace.dataset.nicho);
    };
    document.addEventListener("click", alTocar, true);

    return () => {
      observador.disconnect();
      mutaciones.disconnect();
      temporizadores.forEach(clearTimeout);
      document.removeEventListener("click", alTocar, true);
    };
  }, []);

  return null;
}
