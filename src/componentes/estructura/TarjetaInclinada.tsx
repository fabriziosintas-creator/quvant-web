"use client";

import { useRef, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { PASO_GRILLA } from "./GrillaYSalto";

type Props = {
  children: ReactNode;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">;

/**
 * Tarjeta que reacciona al puntero: se inclina en 3D y, de paso, publica
 * dónde está el puntero en variables CSS para que GrillaYSalto encienda la
 * grilla y mueva el punto que salta (una sola escucha para las dos cosas).
 *
 * La inclinación es solo con mouse de verdad (hover + pointer fine) y sin
 * prefers-reduced-motion. En táctil, el toque hace lo que el mouse en la
 * computadora: la grilla se enciende donde está el dedo y el punto salta
 * ahí; al soltar, se apaga.
 */
export function TarjetaInclinada({ children, className, ...resto }: Props) {
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
    elemento.style.transition = "transform var(--duracion-media) var(--ease-quvant)";
    elemento.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    elemento.style.setProperty("--cerca", "0");
  };

  /** Táctil: la grilla y el punto van a donde tocó el dedo (sin inclinar). */
  const alTocar = (evento: PointerEvent<HTMLDivElement>) => {
    const elemento = tarjeta.current;
    if (!elemento || evento.pointerType !== "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const caja = elemento.getBoundingClientRect();
    const x = evento.clientX - caja.left;
    const y = evento.clientY - caja.top;
    elemento.style.setProperty("--puntero-x", `${x}px`);
    elemento.style.setProperty("--puntero-y", `${y}px`);
    elemento.style.setProperty("--salto-x", `${Math.round(x / PASO_GRILLA) * PASO_GRILLA}px`);
    elemento.style.setProperty("--salto-y", `${Math.round(y / PASO_GRILLA) * PASO_GRILLA}px`);
    elemento.style.setProperty("--cerca", "1");
  };

  const alSoltar = (evento: PointerEvent<HTMLDivElement>) => {
    if (evento.pointerType !== "touch") return;
    tarjeta.current?.style.setProperty("--cerca", "0");
  };

  return (
    <div
      ref={tarjeta}
      {...resto}
      onPointerMove={alMover}
      onPointerLeave={alSalir}
      onPointerDown={alTocar}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
      // La capa propia solo hace falta donde se inclina (con mouse): en el
      // celular serían quince capas de más en memoria.
      className={`[@media(hover:hover)_and_(pointer:fine)]:will-change-transform ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
