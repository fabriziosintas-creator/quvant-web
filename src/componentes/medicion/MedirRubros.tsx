"use client";

import { useEffect } from "react";
import { fraccionVista, origenDe, profundidadDe, tramoDe } from "./atencion";
import { medir } from "./medir";

/** Cuánto tiene que estar la página a la vista para contar como visita. */
const ESPERA_VISITA_MS = 2000;

/**
 * Mide la web pública sin tocar los componentes que ya existen:
 *  · visita: una por pestaña, cuando la página estuvo a la vista dos
 *    segundos (lo que se abre de fondo y se cierra sin mirar no cuenta).
 *    La base la limita a una cada 30 minutos por navegador.
 *  · cuando un rubro entra en pantalla y queda (más de la mitad visible
 *    durante un segundo), vista_nicho. Vale para los paneles del selector
 *    (data-nicho en su panel) y para cualquier bloque marcado con
 *    data-medir-nicho="<id>".
 *  · clic en un enlace marcado data-medir="demo" o "contacto" (con
 *    data-nicho si es de un rubro): clic_demo / clic_contacto.
 * Un rubro se cuenta una vez por carga de página; la base además lo
 * limita a una vez cada 30 minutos por visita.
 *  · de dónde vino la visita (origen), una vez por sesión: buscador, redes,
 *    campaña, otro sitio o directo; nunca la dirección exacta.
 *  · la atención a cada rubro: cuánto estuvo a la vista (tiempo_nicho, en
 *    tramos) y hasta dónde bajó dentro de su bloque (profundidad_nicho), una
 *    vez por carga, al ocultar o cerrar la página.
 */
export function MedirRubros() {
  useEffect(() => {
    let esperaVisita: ReturnType<typeof setTimeout> | null = null;
    const contarVisita = () => {
      if (document.visibilityState !== "visible") {
        if (esperaVisita) clearTimeout(esperaVisita);
        esperaVisita = null;
        return;
      }
      esperaVisita ??= setTimeout(() => {
        document.removeEventListener("visibilitychange", contarVisita);
        medir("visita");
      }, ESPERA_VISITA_MS);
    };
    document.addEventListener("visibilitychange", contarVisita);
    contarVisita();

    // ── De dónde vino (una vez por sesión) ──
    try {
      if (!sessionStorage.getItem("quvant-origen")) {
        sessionStorage.setItem("quvant-origen", "si");
        medir("origen", null, origenDe(document.referrer, window.location.href));
      }
    } catch {
      // Sin sessionStorage (modo privado estricto): no se mide el origen.
    }

    // ── Atención a cada rubro: tiempo a la vista y profundidad ──
    const atencion = new Map<string, { ms: number; desde: number | null; maximo: number }>();
    const enviados = new Set<string>();
    const bloques = new Map<Element, string>();
    const deRubro = (n: string) => {
      let a = atencion.get(n);
      if (!a) atencion.set(n, (a = { ms: 0, desde: null, maximo: 0 }));
      return a;
    };
    const alMoverse = () => {
      for (const [el, n] of bloques) {
        if (!el.isConnected) continue;
        const caja = el.getBoundingClientRect();
        const a = deRubro(n);
        a.maximo = Math.max(a.maximo, fraccionVista(caja.top, caja.height, window.innerHeight));
      }
    };
    let cuadro = 0;
    const alDesplazar = () => {
      if (cuadro) return;
      cuadro = requestAnimationFrame(() => {
        cuadro = 0;
        alMoverse();
      });
    };
    window.addEventListener("scroll", alDesplazar, { passive: true });
    /** Al ocultar o cerrar: lo de cada rubro, una sola vez por carga. */
    const mandarAtencion = () => {
      const ahora = performance.now();
      for (const [n, a] of atencion) {
        if (enviados.has(n)) continue;
        const ms = a.ms + (a.desde === null ? 0 : ahora - a.desde);
        if (ms < 1000) continue;
        enviados.add(n);
        medir("tiempo_nicho", n, tramoDe(ms));
        const p = profundidadDe(a.maximo);
        if (p) medir("profundidad_nicho", n, p);
      }
    };
    const alOcultar = () => document.visibilityState === "hidden" && mandarAtencion();
    document.addEventListener("visibilitychange", alOcultar);
    window.addEventListener("pagehide", mandarAtencion);

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
          if (!nicho) continue;
          // El reloj de atención corre mientras el bloque está a la vista.
          bloques.set(entrada.target, nicho);
          const a = deRubro(nicho);
          if (aLaVista(entrada) && a.desde === null) a.desde = performance.now();
          else if (!aLaVista(entrada) && a.desde !== null) {
            a.ms += performance.now() - a.desde;
            a.desde = null;
          }
          if (vistos.has(nicho)) continue;
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
      mandarAtencion();
      window.removeEventListener("scroll", alDesplazar);
      document.removeEventListener("visibilitychange", alOcultar);
      window.removeEventListener("pagehide", mandarAtencion);
      if (cuadro) cancelAnimationFrame(cuadro);
      if (esperaVisita) clearTimeout(esperaVisita);
      document.removeEventListener("visibilitychange", contarVisita);
      observador.disconnect();
      mutaciones.disconnect();
      temporizadores.forEach(clearTimeout);
      document.removeEventListener("click", alTocar, true);
    };
  }, []);

  return null;
}
