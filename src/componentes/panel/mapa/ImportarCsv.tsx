"use client";

import { useActionState } from "react";
import { Aviso, ErrorCampo } from "@/componentes/cuenta/Campos";
import { CLASE_BOTON, CLASE_ETIQUETA } from "@/componentes/cuenta/estilos";
import { PANEL_ADMIN } from "@/datos/textos";
import { importarCsv, type EstadoFormulario } from "@/servidor/panel/locales";

const T = PANEL_ADMIN.mapa.importar;
const INICIAL: EstadoFormulario = { estado: "inicial" };

/** Importar una planilla de prospección exportada como CSV (solo lectura de la planilla). */
export function ImportarCsv({ hayClaveServidor }: { hayClaveServidor: boolean }) {
  const [estado, enviar, enviando] = useActionState(importarCsv, INICIAL);
  const e = estado.errores ?? {};
  return (
    <form action={enviar} className="flex flex-col gap-4 border border-profundo p-4 md:p-5">
      {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
      {estado.estado === "listo" && estado.mensaje ? <Aviso tipo="listo">{estado.mensaje}</Aviso> : null}
      {!hayClaveServidor ? <Aviso tipo="nota">{T.sinClaveServidor}</Aviso> : null}
      <div>
        <label htmlFor="importar-archivo" className={CLASE_ETIQUETA}>
          {T.archivo}
        </label>
        <input
          id="importar-archivo"
          name="archivo"
          type="file"
          accept=".csv,text/csv"
          required
          aria-invalid={e.archivo ? true : undefined}
          className="block w-full font-plex text-sm text-acero file:mr-4 file:border file:border-profundo file:bg-negro file:px-4 file:py-2 file:font-plex file:text-xs file:uppercase file:tracking-etiqueta file:text-blanco"
        />
        <ErrorCampo id="importar-archivo-error" mensaje={e.archivo} />
      </div>
      <div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? T.importando : T.boton}
        </button>
      </div>
    </form>
  );
}
