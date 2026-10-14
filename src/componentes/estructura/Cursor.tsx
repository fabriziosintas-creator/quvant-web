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
 * Solo con mouse de verdad (hover + pointer fine) y en vista 3D, que ya
 * cubre prefers-reduced-motion. Mientras está activo, <html data-cursor>
 * apaga el cursor del sistema (ver globals.css).
 */

const INTERACTIVO = 'a, button, [role="tab"], [role="button"], label, summary, select';
const ESCRITURA = "input, textarea, [contenteditable]";

export function Cursor() {
  const vista = useVista();
  const punto = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = punto.current;
    if (!elemento || vista !== "3d") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const raiz = document.documentElement;
    raiz.dataset.cursor = "si";

    const moverX = gsap.quickTo(elemento, "x", { duration: 0.16, ease: "power3.out" });
    const moverY = gsap.quickTo(elemento, "y", { duration: 0.16, ease: "power3.out" });
    let visible = false;

    const estado = (modo: "punto" | "marco" | "oculto") => {
      elemento.dataset.modo = modo;
    };

    const alMover = (evento: PointerEvent) => {
      moverX(evento.clientX);
      moverY(evento.clientY);
      if (!visible) {
        visible = true;
        gsap.to(elemento, { opacity: 1, duration: 0.25 });
      }
      const sobre = evento.target as Element | null;
      if (!sobre || !(sobre instanceof Element)) return;
      if (sobre.closest(ESCRITURA)) estado("oculto");
      else if (sobre.closest(INTERACTIVO)) estado("marco");
      else estado("punto");
    };
    const alSalir = () => {
      visible = false;
      gsap.to(elemento, { opacity: 0, duration: 0.2 });
    };

    window.addEventListener("pointermove", alMover, { passive: true });
    document.documentElement.addEventListener("pointerleave", alSalir);
    return () => {
      window.removeEventListener("pointermove", alMover);
      document.documentElement.removeEventListener("pointerleave", alSalir);
      delete raiz.dataset.cursor;
    };
  }, [vista]);

  if (vista !== "3d") return null;

  return (
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
  );
}
