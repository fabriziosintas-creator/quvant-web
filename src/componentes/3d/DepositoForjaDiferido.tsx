"use client";

import dynamic from "next/dynamic";
import { PLATAFORMAS } from "@/datos/textos";
import { useVista } from "@/estado/vista";

const DepositoForja = dynamic(() => import("./DepositoForja"), { ssr: false });

/** La ventana con el depósito 3D de Forja y su etiqueta de honestidad.
 *  Sigue la vista elegida del sitio: en vista texto el marco queda vacío.
 *  `activo` apaga el lienzo cuando el panel del rubro no está a la vista. */
export function DepositoForjaDiferido({ activo = true }: { activo?: boolean }) {
  const conWebGL = useVista() === "3d";

  return (
    <figure className="overflow-hidden rounded-[8px] border border-profundo">
      <figcaption className="flex items-center gap-3 border-b border-profundo px-4 py-2.5">
        <span aria-hidden className="size-1.5 bg-acero" />
        <span className="font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
          {PLATAFORMAS.forjaVentana}
        </span>
      </figcaption>
      <div className="relative aspect-[16/10] bg-negro">
        {conWebGL && activo ? (
          <DepositoForja />
        ) : (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center font-plex text-xs text-acero">
            {PLATAFORMAS.forjaApagado}
          </p>
        )}
        <p className="pointer-events-none absolute bottom-3 right-4 font-plex text-[10px] uppercase tracking-etiqueta text-acero">
          {PLATAFORMAS.ilustracionEjemplo}
        </p>
      </div>
    </figure>
  );
}
