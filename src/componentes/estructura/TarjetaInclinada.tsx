"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { PASO_GRILLA } from "./GrillaYSalto";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Tarjeta que reacciona al puntero: se inclina en 3D y, de paso, publica
 * dónde está el puntero en variables CSS para que GrillaYSalto encienda la
 * grilla y mueva el punto que salta (una sola escucha para las dos cosas).
 *
 * Solo actúa con mouse de verdad (hover + pointer fine) y sin
 * prefers-reduced-motion; en táctil o con movimiento reducido es una
 * tarjeta común, con la grilla quieta.
 */
export function TarjetaInclinada({ children, className }: Props) {
  const tarjeta = useRef<HTMLDivElement>(null);

  const puedeInclinar = () =>
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const alMover = (evento: PointerEvent<HTMLDivElement>) => {
    const elemento = tarjeta.current;
    if (!elemento || !puedeInclinar()) return;
    const caja = elemento.getBoundingClientRect();
    const x = evento.clientX - caja.left;
    const y = evento.clientY - caja.top;

    elemento.style.transition = "transform 80ms linear";
    elemento.style.transform = `perspective(900px) rotateX(${(
      -(y / caja.height - 0.5) * 7
    ).toFixed(2)}deg) rotateY(${((x / caja.width - 0.5) * 9).toFixed(2)}deg)`;

    elemento.style.setProperty("--puntero-x", `${x}px`);
    elemento.style.setProperty("--puntero-y", `${y}px`);
    // El salto es al nodo más cercano, nunca a un punto intermedio.
    elemento.style.setProperty("--salto-x", `${Math.round(x / PASO_GRILLA) * PASO_GRILLA}px`);
    elemento.style.setProperty("--salto-y", `${Math.round(y / PASO_GRILLA) * PASO_GRILLA}px`);
    elemento.style.setProperty("--cerca", "1");
  };

  const alSalir = () => {
    const elemento = tarjeta.current;
    if (!elemento) return;
    elemento.style.transition = "transform 450ms cubic-bezier(0.22, 1, 0.36, 1)";
    elemento.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    elemento.style.setProperty("--cerca", "0");
  };

  return (
    <div
      ref={tarjeta}
      onPointerMove={alMover}
      onPointerLeave={alSalir}
      className={`will-change-transform ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
