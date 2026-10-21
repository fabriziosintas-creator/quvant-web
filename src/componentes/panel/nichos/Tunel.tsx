"use client";

import { useParams } from "next/navigation";
import { lazy, Suspense, useSyncExternalStore } from "react";
import { ACENTO_NICHO } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";

/**
 * Lo que se ve mientras carga un nicho: la carga ES la animación. El túnel
 * 3D (EscenaTunel) solo con WebGL, sin "menos movimiento" y fuera del modo
 * liviano; si no, el nombre del nicho y un fundido. Toma el nicho de la
 * ruta, así sirve igual en loading.tsx que como fallback de un Suspense.
 */

const EscenaTunel = lazy(() => import("./EscenaTunel"));
const T = PANEL_ADMIN.nichos;

/** Para precargar el túnel al pasar por una puerta (antes del clic). */
export const precargarTunel = () => void import("./EscenaTunel");

function puede3D() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (document.documentElement.dataset.liviano === "si") return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
const nada = () => () => {};

export function Tunel({ nombre }: { nombre?: string }) {
  const { nicho } = useParams<{ nicho?: string }>();
  const id = nicho ?? "";
  const color = id in ACENTO_NICHO ? ACENTO_NICHO[id as keyof typeof ACENTO_NICHO] : "#ECECEE";
  const con3D = useSyncExternalStore(nada, puede3D, () => false);
  const titulo = nombre ?? T.nombres[id as keyof typeof T.nombres] ?? id;

  return (
    <div role="status" aria-live="polite" className="relative h-[60svh] min-h-80 w-full overflow-hidden border border-profundo bg-negro">
      {con3D ? (
        <Suspense fallback={null}>
          <div className="absolute inset-0">
            <EscenaTunel color={color} />
          </div>
        </Suspense>
      ) : null}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
        <span aria-hidden className="size-3 animate-[latido_1.2s_ease-out_infinite]" style={{ background: color }} />
        <p className="font-michroma text-xl uppercase tracking-marca text-blanco md:text-3xl">{titulo}</p>
        <p className="font-plex text-xs uppercase tracking-etiqueta text-acero">{T.entrando}</p>
      </div>
    </div>
  );
}
