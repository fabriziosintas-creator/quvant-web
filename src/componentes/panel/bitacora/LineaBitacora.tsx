"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { describir, enlaceDe, lineasDe, motivoNoDeshacer, type Entrada } from "@/bitacora/bitacora";
import { PANEL_ADMIN } from "@/datos/textos";
import { deshacerCambio } from "@/servidor/bitacora/acciones";
import { TEXTOS_BITACORA } from "./textos";

const B = PANEL_ADMIN.bitacora;

const hora = (iso: string) => new Date(iso).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" });

/** Una línea de la bitácora: la frase, cuándo, el detalle campo por campo y "Deshacer" si se puede. */
export function LineaBitacora({ e, nombre, conEnlace = true }: { e: Entrada; nombre: string | null; conEnlace?: boolean }) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  const lineas = lineasDe(e, TEXTOS_BITACORA);
  const enlace = conEnlace ? enlaceDe(e) : null;
  const motivo = motivoNoDeshacer(e);
  const exportado = e.accion === "exportacion" && e.detalle && Object.keys(e.detalle).length ? Object.entries(e.detalle).map(([k, v]) => `${k}: ${String(v)}`).join(" · ") : null;

  const deshacer = () => {
    if (!window.confirm(B.confirmarDeshacer)) return;
    iniciar(async () => {
      const r = await deshacerCambio(e.id);
      setMensaje(r.mensaje);
      if (r.ok) router.refresh();
    });
  };

  return (
    <li className="flex flex-col gap-1 border-b border-profundo/60 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-lectura text-sm text-blanco">
          {enlace ? (
            <Link href={enlace} className="underline decoration-profundo underline-offset-4 hover:decoration-blanco">
              {describir(e, nombre, TEXTOS_BITACORA)}
            </Link>
          ) : (
            describir(e, nombre, TEXTOS_BITACORA)
          )}
        </p>
        <span className="font-plex text-[11px] tabular-nums text-acero">
          {B.acciones[e.accion]} · {hora(e.creadoEn)}
        </span>
      </div>
      {exportado ? <p className="font-plex text-xs text-acero">{exportado}</p> : null}
      {lineas.length > 0 ? (
        <div className="flex flex-wrap items-center gap-4 font-plex text-[11px] uppercase tracking-etiqueta text-acero">
          <button type="button" onClick={() => setAbierta((a) => !a)} aria-expanded={abierta} className="hover:text-blanco">
            {B.detalles}
          </button>
          {e.accion === "cambio" || e.accion === "deshacer" ? (
            motivo ? (
              <span className="normal-case tracking-normal">{B.noDeshacer[motivo]}</span>
            ) : (
              <button type="button" onClick={deshacer} disabled={ocupado} className="text-blanco hover:underline disabled:opacity-50">
                {B.deshacer}
              </button>
            )
          ) : null}
        </div>
      ) : null}
      {mensaje ? (
        <p role="status" className="font-plex text-xs text-acero">
          {mensaje}
        </p>
      ) : null}
      {abierta ? (
        <dl className="mt-1 grid gap-1 border-l border-profundo pl-3 font-plex text-xs">
          {lineas.map((l) => (
            <div key={l.campo} className="flex flex-wrap gap-x-2">
              <dt className="text-acero">{l.campo}:</dt>
              <dd className="text-blanco">{e.accion === "cambio" || e.accion === "deshacer" ? `${l.antes} → ${l.despues}` : l.antes || l.despues}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </li>
  );
}
