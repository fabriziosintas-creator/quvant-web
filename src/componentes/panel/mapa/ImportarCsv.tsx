"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Aviso, ErrorCampo } from "@/componentes/cuenta/Campos";
import { CLASE_BOTON, CLASE_ETIQUETA } from "@/componentes/cuenta/estilos";
import { PANEL_ADMIN } from "@/datos/textos";
import { importarCsv, ubicarPendientes, type EstadoFormulario } from "@/servidor/panel/locales";

const T = PANEL_ADMIN.mapa.importar;
const INICIAL: EstadoFormulario & { pendientes?: number } = { estado: "inicial" };

/**
 * Importar una planilla de prospección exportada como CSV (solo lectura
 * de la planilla). Los locales se cargan enseguida y después se ubican de
 * a tandas en el servidor, a una consulta por segundo: la pantalla va
 * pidiendo tandas mientras esté abierta y muestra cuánto falta. Si se
 * cierra, lo que falta queda pendiente y se sigue con "Seguir ubicando".
 */
export function ImportarCsv({ pendientesAlCargar }: { pendientesAlCargar: number }) {
  const router = useRouter();
  const [cola, setCola] = useState<{ corriendo: boolean; quedan: number; ubicados: number; sinUbicar: number; error?: string }>({
    corriendo: false,
    quedan: pendientesAlCargar,
    ubicados: 0,
    sinUbicar: 0,
  });
  const vivo = useRef(true);
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  const ubicar = useCallback(async () => {
    setCola((c) => ({ ...c, corriendo: true, error: undefined }));
    for (;;) {
      const tanda = await ubicarPendientes();
      if (!vivo.current) return;
      setCola((c) => ({ corriendo: tanda.quedan > 0 && !tanda.error, quedan: tanda.quedan, ubicados: c.ubicados + tanda.ubicados, sinUbicar: c.sinUbicar + tanda.sinUbicar, error: tanda.error }));
      router.refresh();
      if (tanda.quedan === 0 || tanda.error || tanda.ubicados + tanda.sinUbicar === 0) return;
    }
  }, [router]);

  // Apenas termina de importar, arranca a ubicar.
  const [estado, enviar, enviando] = useActionState(async (previo: typeof INICIAL, datos: FormData) => {
    const resultado = await importarCsv(previo, datos);
    if (resultado.estado === "listo" && (resultado.pendientes ?? 0) > 0) void ubicar();
    return resultado;
  }, INICIAL);

  const e = estado.errores ?? {};
  return (
    <form action={enviar} className="flex flex-col gap-4 border border-profundo p-4 md:p-5">
      {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
      {estado.estado === "listo" && estado.mensaje ? <Aviso tipo="listo">{estado.mensaje}</Aviso> : null}
      {cola.corriendo || cola.ubicados + cola.sinUbicar > 0 || cola.quedan > 0 ? (
        <Aviso tipo={cola.error ? "error" : "nota"}>
          <span aria-live="polite">
            {cola.corriendo
              ? T.cola.ubicando.replace("{quedan}", String(cola.quedan))
              : cola.quedan > 0
                ? T.cola.pendientes.replace("{quedan}", String(cola.quedan))
                : T.cola.listo}
            {cola.ubicados + cola.sinUbicar > 0 ? ` ${T.cola.resumen.replace("{ubicados}", String(cola.ubicados)).replace("{sinUbicar}", String(cola.sinUbicar))}` : ""}
            {cola.error ? ` ${cola.error}` : ""}
          </span>
          {!cola.corriendo && cola.quedan > 0 ? (
            <>
              {" "}
              <button type="button" onClick={() => void ubicar()} className="underline decoration-acero underline-offset-4 hover:decoration-blanco">
                {T.cola.seguir}
              </button>
            </>
          ) : null}
        </Aviso>
      ) : null}
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
        <button type="submit" disabled={enviando || cola.corriendo} className={CLASE_BOTON}>
          {enviando ? T.importando : T.boton}
        </button>
      </div>
    </form>
  );
}
