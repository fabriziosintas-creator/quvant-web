"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * Una grilla de tarjetas de luz (.tarjeta-luz, en globals.css): cada una se
 * inclina un poco en 3D siguiendo al mouse, con un reflejo que lo acompaña.
 * Se endereza mientras se usa lo de adentro (al apretar), para que mover un
 * control no haga bailar la tarjeta. Solo con mouse y sin "menos
 * movimiento". La usan las situaciones de la promo y el contacto.
 */
export function GrillaLuz({ children, className }: { children: ReactNode; className?: string }) {
  const actual = useRef<HTMLElement | null>(null);
  const apretado = useRef(false);

  const enderezar = () => {
    actual.current?.style.removeProperty("--rx");
    actual.current?.style.removeProperty("--ry");
  };

  const mover = (evento: PointerEvent<HTMLDivElement>) => {
    if (evento.pointerType !== "mouse" || apretado.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tarjeta = (evento.target as HTMLElement).closest<HTMLElement>(".tarjeta-luz");
    if (actual.current && actual.current !== tarjeta) enderezar();
    actual.current = tarjeta;
    if (!tarjeta) return;
    const caja = tarjeta.getBoundingClientRect();
    const x = (evento.clientX - caja.left) / caja.width - 0.5;
    const y = (evento.clientY - caja.top) / caja.height - 0.5;
    tarjeta.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
    tarjeta.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
    tarjeta.style.setProperty("--luz-x", `${((x + 0.5) * 100).toFixed(0)}%`);
    tarjeta.style.setProperty("--luz-y", `${((y + 0.5) * 100).toFixed(0)}%`);
  };

  return (
    <div
      onPointerMove={mover}
      onPointerLeave={() => {
        enderezar();
        actual.current = null;
      }}
      onPointerDown={() => {
        apretado.current = true;
        enderezar();
      }}
      onPointerUp={() => (apretado.current = false)}
      className={className}
    >
      {children}
    </div>
  );
}
