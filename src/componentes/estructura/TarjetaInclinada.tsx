"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Tarjeta que se inclina en 3D siguiendo el puntero. Solo actúa con mouse
 * de verdad (hover + pointer fine) y sin prefers-reduced-motion; en táctil
 * o con movimiento reducido es una tarjeta común.
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
    const x = (evento.clientX - caja.left) / caja.width - 0.5;
    const y = (evento.clientY - caja.top) / caja.height - 0.5;
    elemento.style.transition = "transform 80ms linear";
    elemento.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(
      x * 9
    ).toFixed(2)}deg)`;
  };

  const alSalir = () => {
    const elemento = tarjeta.current;
    if (!elemento) return;
    elemento.style.transition = "transform 450ms cubic-bezier(0.22, 1, 0.36, 1)";
    elemento.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
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
