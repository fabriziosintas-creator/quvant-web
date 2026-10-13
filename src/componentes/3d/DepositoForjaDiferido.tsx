"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { PLATAFORMAS } from "@/datos/textos";

const DepositoForja = dynamic(() => import("./DepositoForja"), { ssr: false });

// Misma decisión que la portada: sin WebGL no hay pantalla rota, hay texto.
let soporteDecidido: boolean | null = null;
const haySoporte = (): boolean => {
  if (soporteDecidido !== null) return soporteDecidido;
  try {
    const lienzo = document.createElement("canvas");
    soporteDecidido = Boolean(lienzo.getContext("webgl2") || lienzo.getContext("webgl"));
  } catch {
    soporteDecidido = false;
  }
  return soporteDecidido;
};
const enServidor = () => false;
const suscribir = () => () => {};

/** La ventana con el depósito 3D de Forja y su etiqueta de honestidad.
 *  `activo` apaga el lienzo cuando el panel del rubro no está a la vista. */
export function DepositoForjaDiferido({ activo = true }: { activo?: boolean }) {
  const conWebGL = useSyncExternalStore(suscribir, haySoporte, enServidor);

  return (
    <figure className="overflow-hidden rounded-[8px] border border-profundo">
      <figcaption className="flex items-center gap-3 border-b border-profundo px-4 py-2.5">
        <span aria-hidden className="size-1.5 bg-acero" />
        <span className="font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
          {PLATAFORMAS.forjaVentana}
        </span>
      </figcaption>
      <div className="relative aspect-[16/10] bg-negro">
        {conWebGL && activo ? <DepositoForja /> : null}
        <p className="pointer-events-none absolute bottom-3 right-4 font-plex text-[10px] uppercase tracking-etiqueta text-acero">
          {PLATAFORMAS.ilustracionEjemplo}
        </p>
      </div>
    </figure>
  );
}
