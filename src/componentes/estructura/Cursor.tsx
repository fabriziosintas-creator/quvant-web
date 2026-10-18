"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useVista } from "@/estado/vista";

/**
 * El cursor propio: el punto cuadrado de la marca siguiendo al puntero con
 * un poco de inercia. Sobre un enlace o un botón se abre en un marco
 * cuadrado; sobre un campo de texto se esconde y vuelve el cursor normal.
 *
 * Va en mix-blend-mode: difference, así es blanco sobre negro y negro
 * sobre los botones blancos sin pensar en cada caso.
 *
 * Lo que lleve data-cursor-texto (las tarjetas del portfolio) cambia el
 * punto por una etiqueta con ese texto. La etiqueta va en su propia capa,
 * sin mezcla: sobre una captura de colores la diferencia la volvería
 * ilegible.
 *
 * Solo con mouse de verdad (hover + pointer fine) y en vista 3D, que ya
 * cubre prefers-reduced-motion. Mientras está activo, <html data-cursor>
 * apaga el cursor del sistema (ver globals.css).
 */

const INTERACTIVO = 'a, button, [role="tab"], [role="button"], label, summary, select';
const ESCRITURA = "input, textarea, [contenteditable]";

export function Cursor() {
  const vista = useVista();
  const punto = useRef<HTMLDivElement>(null);
  const etiqueta = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = punto.current;
    const cartel = etiqueta.current;
    if (!elemento || !cartel || vista !== "3d") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const raiz = document.documentElement;
    raiz.dataset.cursor = "si";

    const moverX = gsap.quickTo([elemento, cartel], "x", { duration: 0.16, ease: "power3.out" });
    const moverY = gsap.quickTo([elemento, cartel], "y", { duration: 0.16, ease: "power3.out" });
    let visible = false;

    const estado = (modo: "punto" | "marco" | "oculto" | "texto", texto = "") => {
      elemento.dataset.modo = modo;
      cartel.dataset.visible = modo === "texto" ? "si" : "no";
      if (texto && cartel.textContent !== texto) cartel.textContent = texto;
    };

    const leer = (sobre: Element | null) => {
      if (!sobre || !(sobre instanceof Element)) return;
      const conTexto = sobre.closest<HTMLElement>("[data-cursor-texto]");
      if (sobre.closest(ESCRITURA)) estado("oculto");
      else if (conTexto) estado("texto", conTexto.dataset.cursorTexto);
      else if (sobre.closest(INTERACTIVO)) estado("marco");
      else estado("punto");
    };

    let ultimoX = -1;
    let ultimoY = -1;
    const alMover = (evento: PointerEvent) => {
      ultimoX = evento.clientX;
      ultimoY = evento.clientY;
      moverX(evento.clientX);
      moverY(evento.clientY);
      if (!visible) {
        visible = true;
        gsap.to([elemento, cartel], { opacity: 1, duration: 0.25 });
      }
      leer(evento.target as Element | null);
    };

    // Un clic puede abrir o cerrar algo justo debajo del puntero (el visor
    // del portfolio): se vuelve a mirar qué quedó ahí, sin esperar a que se mueva.
    let pendiente = 0;
    const alClickear = () => {
      window.clearTimeout(pendiente);
      pendiente = window.setTimeout(() => {
        if (ultimoX >= 0) leer(document.elementFromPoint(ultimoX, ultimoY));
      }, 450);
    };
    const alSalir = () => {
      visible = false;
      gsap.to([elemento, cartel], { opacity: 0, duration: 0.2 });
    };

    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("click", alClickear, { capture: true, passive: true });
    window.addEventListener("keydown", alClickear, { passive: true });
    document.documentElement.addEventListener("pointerleave", alSalir);
    return () => {
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("click", alClickear, { capture: true });
      window.removeEventListener("keydown", alClickear);
      document.documentElement.removeEventListener("pointerleave", alSalir);
      window.clearTimeout(pendiente);
      delete raiz.dataset.cursor;
    };
  }, [vista]);

  if (vista !== "3d") return null;

  return (
    <>
      <div
        ref={punto}
        aria-hidden
        data-modo="punto"
        className="cursor-propio pointer-events-none fixed left-0 top-0 z-[80] opacity-0 mix-blend-difference"
      >
        {/* El punto: siempre. */}
        <span className="cursor-punto absolute left-0 top-0 block bg-blanco" />
        {/* El marco: se abre sobre lo que se puede tocar. */}
        <span className="cursor-marco absolute left-0 top-0 block border border-blanco" />
      </div>
      {/* La etiqueta: sin mezcla, para que se lea sobre cualquier imagen. */}
      <div
        ref={etiqueta}
        aria-hidden
        data-visible="no"
        className="cursor-etiqueta pointer-events-none fixed left-0 top-0 z-[80] opacity-0"
      />
    </>
  );
}
