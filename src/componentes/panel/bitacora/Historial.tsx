"use client";

import { useState } from "react";
import type { Entrada } from "@/bitacora/bitacora";
import { PANEL_ADMIN } from "@/datos/textos";
import { LineaBitacora } from "./LineaBitacora";

const B = PANEL_ADMIN.bitacora;

/** "Historial" plegable de una ficha: los cambios de ese registro, pedidos recién al abrirlo. */
export function Historial({ tabla, registroId }: { tabla: string; registroId: string }) {
  const [datos, setDatos] = useState<{ entradas: Entrada[]; nombres: Record<string, string>; falta?: boolean } | null>(null);
  const [cargando, setCargando] = useState(false);

  const alAbrir = async (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open || cargando) return;
    setCargando(true);
    const r = await fetch(`/api/panel/bitacora?tabla=${tabla}&registro=${encodeURIComponent(registroId)}`, { cache: "no-store" }).catch(() => null);
    setDatos(r?.ok ? await r.json() : { entradas: [], nombres: {}, falta: true });
    setCargando(false);
  };

  return (
    <details onToggle={alAbrir} className="border-t border-profundo pt-4">
      <summary className="cursor-pointer font-plex text-[11px] uppercase tracking-etiqueta text-acero hover:text-blanco">{B.historial}</summary>
      <div className="mt-2">
        {cargando || !datos ? (
          <p className="font-plex text-xs text-acero">{PANEL_ADMIN.cargando}</p>
        ) : datos.falta ? (
          <p className="font-plex text-xs text-acero">{B.falta}</p>
        ) : datos.entradas.length === 0 ? (
          <p className="font-plex text-xs text-acero">{B.sinHistorial}</p>
        ) : (
          <ul>
            {datos.entradas.map((e) => (
              <LineaBitacora key={e.id} e={e} nombre={e.quien ? (datos.nombres[e.quien] ?? null) : null} conEnlace={false} />
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
