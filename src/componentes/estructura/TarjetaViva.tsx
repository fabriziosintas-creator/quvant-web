"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { GrillaYSalto } from "./GrillaYSalto";
import { TarjetaInclinada } from "./TarjetaInclinada";

type Props = {
  children: ReactNode;
  /** Clases del recuadro: borde, padding, fondo. */
  className?: string;
  /** Por defecto ocupa todo el alto disponible; en false mide lo que su contenido. */
  estirar?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">;

/**
 * La tarjeta estándar del sitio con vida: se inclina con el puntero y
 * enciende la grilla con el punto que salta. Para usar en cualquier
 * recuadro que no sea un botón (equipo, productos, contacto, cierre).
 *
 * Lo que llegue como atributo extra (por ejemplo data-revelar) va al
 * contenedor exterior, así la aparición al scroll mueve toda la tarjeta.
 */
export function TarjetaViva({ children, className = "", estirar = true, ...resto }: Props) {
  return (
    <TarjetaInclinada className={estirar ? "h-full" : undefined} {...resto}>
      <div className={`relative overflow-hidden ${estirar ? "h-full" : ""} ${className}`}>
        <GrillaYSalto />
        <div className="relative flex h-full flex-col">{children}</div>
      </div>
    </TarjetaInclinada>
  );
}
