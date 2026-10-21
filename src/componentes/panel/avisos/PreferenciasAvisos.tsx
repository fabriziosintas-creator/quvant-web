"use client";

import { useActionState } from "react";
import { TIPOS_AVISO, type TipoAviso } from "@/avisos/avisos";
import { PANEL_ADMIN } from "@/datos/textos";
import { guardarPreferencias } from "@/servidor/avisos/acciones";

const T = PANEL_ADMIN.avisos;

/** Qué tipos de aviso ve cada socio en la campanita y cuáles le llegan también por WhatsApp. */
export function PreferenciasAvisos({ apagados, porWhatsapp, hayCanal }: { apagados: TipoAviso[]; porWhatsapp: TipoAviso[]; hayCanal: boolean }) {
  const [estado, accion, enviando] = useActionState(guardarPreferencias, {});
  return (
    <form action={accion} className="flex flex-col gap-4">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-profundo font-plex text-[10px] uppercase tracking-etiqueta text-acero">
            <th scope="col" className="py-2 pr-3 font-normal">{T.pagina.tipo}</th>
            <th scope="col" className="w-24 py-2 text-center font-normal">{T.pagina.ver}</th>
            <th scope="col" className="w-24 py-2 text-center font-normal">{T.pagina.whatsapp}</th>
          </tr>
        </thead>
        <tbody>
          {TIPOS_AVISO.map((tipo) => (
            <tr key={tipo} className="border-b border-profundo/60">
              <th scope="row" className="py-3 pr-3 text-left font-normal">
                <span className="block font-lectura text-sm text-blanco">{T.tipos[tipo]}</span>
                <span className="block font-plex text-xs text-acero">{T.explicaciones[tipo]}</span>
              </th>
              <td className="py-3 text-center">
                <input type="checkbox" name="ver" value={tipo} defaultChecked={!apagados.includes(tipo)} aria-label={`${T.tipos[tipo]}: ${T.pagina.ver}`} className="size-4 accent-blanco" />
              </td>
              <td className="py-3 text-center">
                <input type="checkbox" name="whatsapp" value={tipo} defaultChecked={porWhatsapp.includes(tipo)} aria-label={`${T.tipos[tipo]}: ${T.pagina.whatsapp}`} className="size-4 accent-blanco" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!hayCanal ? <p className="font-plex text-xs text-acero">{T.pagina.sinCanal}</p> : null}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={enviando} className="border border-blanco px-4 py-2 font-plex text-xs uppercase tracking-etiqueta text-blanco transition-colors hover:bg-blanco hover:text-negro disabled:opacity-50">
          {T.pagina.guardar}
        </button>
        <p role="status" className="font-plex text-xs text-acero">{estado.mensaje}</p>
      </div>
    </form>
  );
}
